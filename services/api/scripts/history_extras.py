"""Present-day photographs and İz Bırak samples of one eser's `gecmisi-gor/` folder (decision §11.47).

`bugunku-esler.json` holds the team's present-day pair of an archive photograph (matched by `fotoAtlasId`);
`izler.json` holds İz Bırak contributions, of which only the approved team-made samples (`ornek: true`, `durum: onaylandi`)
are read: a real visitor's contribution is a memory made in the app, never a file. Every photograph keeps its
`kaynakSatiri` and `lisans` word for word; a missing image, credit line, licence or angle match stops the import.
"""
import json
from pathlib import Path

ANGLE = {'ayni': 'same', 'yakin': 'near'}


def _list(path: Path, key: str) -> list:
    return json.loads(path.read_text(encoding='utf-8'))[key] if path.is_file() else []


def _text(record: dict, key: str, where: str) -> str:
    value = record.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'Missing {key}: {where}')
    return value


def _photo(folder: Path, rel: str, record: dict, where: str) -> dict:
    image = _text(record, 'gorsel', where)
    if not (folder / image).is_file():
        raise ValueError(f'Missing image: {rel}/{image}')
    return dict(file=f'{rel}/{image}', credit=_text(record, 'kaynakSatiri', where), license=_text(record, 'lisans', where))


def _angle(record: dict, where: str) -> str:
    word = record.get('aciBenzerligi')
    if word not in ANGLE:
        raise ValueError(f'Unknown aciBenzerligi {word!r}: {where}')
    return ANGLE[word]


def read_extras(folder: Path, rel: str, site_id: str, history: dict) -> tuple:
    """Sets `present` on the archive photographs that have a present-day pair and returns (sample traces, skipped records).

    `folder` is the eser's `gecmisi-gor/` directory, `rel` the same path relative to the content root, `history` maps a
    Foto Atlas id to the manifest entry of that archive photograph.
    """
    for entry in history.values():
        entry['present'] = None
    for pair in _list(folder / 'bugunku-esler.json', 'esler'):
        atlas_id = pair.get('fotoAtlasId')
        where = f'{rel} {atlas_id}'
        entry = history.get(atlas_id)
        if entry is None:
            raise ValueError(f'Present-day pair names no archive photograph: {where}')
        if entry['present'] is not None:
            raise ValueError(f'Two present-day pairs for one archive photograph: {where}')
        entry['present'] = dict(id=f'{site_id}-present-{atlas_id}', alt=f'Bugünkü görünüm: {entry["caption"]}',
                                angleMatch=_angle(pair, where), **_photo(folder, rel, pair, where))
    traces, skipped = [], 0
    for record in _list(folder / 'izler.json', 'izler'):
        if record.get('ornek') is not True or record.get('durum') != 'onaylandi':
            skipped += 1
            continue
        where = f'{rel} {record.get("id")}'
        text = _text(record, 'metin', where)
        linked = record.get('ayniAciFotoAtlasId')
        if linked is not None and linked not in history:
            raise ValueError(f'Sample trace names no archive photograph: {where} {linked}')
        traces.append(dict(id=_text(record, 'id', where), author=_text(record, 'kullanici', where), text=text, alt=text,
                           addedOn=_text(record, 'tarih', where), historyImageId=history[linked]['id'] if linked is not None else None,
                           angleMatch=_angle(record, where) if linked is not None else None, **_photo(folder, rel, record, where)))
    return traces, skipped
