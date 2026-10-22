-- Reference rows for the lookup tables. Idempotent; admins may add more rows later.
-- `aliases` hold normalize()d spellings (lower case, no diacritics, ı → i) used by the importer.
INSERT INTO "role_categories" ("id", "name", "name_en", "waqf_role", "position") VALUES
	('dini', 'Dinî', 'Religious', 'hayrat', 0),
	('su', 'Su', 'Water', 'hayrat', 1),
	('egitim', 'Eğitim ve sosyal', 'Education and social', 'hayrat', 2),
	('akar', 'Akar', 'Income', 'akar', 3)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "site_types" ("id", "name", "name_en", "category_id", "aliases", "position") VALUES
	('cami', 'Cami', 'Mosque', 'dini', ARRAY['cami', 'camii', 'mescit', 'mescid', 'mescidi'], 0),
	('turbe', 'Türbe', 'Tomb', 'dini', ARRAY['turbe', 'turbesi', 'kumbet', 'kumbeti'], 1),
	('tekke', 'Tekke ve zaviye', 'Dervish lodge', 'dini', ARRAY['tekke', 'tekkesi', 'zaviye', 'zaviyesi', 'dergah', 'dergahi'], 2),
	('hazire', 'Hazire', 'Graveyard', 'dini', ARRAY['hazire', 'haziresi'], 3),
	('cesme', 'Çeşme', 'Fountain', 'su', ARRAY['cesme', 'cesmesi'], 10),
	('sebil', 'Sebil', 'Sebil', 'su', ARRAY['sebil', 'sebili'], 11),
	('su-kemeri', 'Su kemeri', 'Aqueduct', 'su', ARRAY['su kemeri', 'su kemerleri'], 12),
	('sarnic', 'Sarnıç', 'Cistern', 'su', ARRAY['sarnic', 'sarnici'], 13),
	('egitim', 'Eğitim yapısı', 'School', 'egitim', ARRAY['medrese', 'medresesi', 'mektep', 'mektebi', 'sibyan mektebi'], 20),
	('kutuphane', 'Kütüphane', 'Library', 'egitim', ARRAY['kutuphane', 'kutuphanesi'], 21),
	('imaret', 'İmaret', 'Soup kitchen', 'egitim', ARRAY['imaret', 'imareti'], 22),
	('darussifa', 'Darüşşifa', 'Hospital', 'egitim', ARRAY['darussifa', 'darussifasi', 'sifahane'], 23),
	('kopru', 'Köprü', 'Bridge', 'egitim', ARRAY['kopru', 'koprusu'], 24),
	('kulliye', 'Külliye', 'Complex', 'egitim', ARRAY['kulliye', 'kulliyesi'], 25),
	('hamam', 'Hamam', 'Bath', 'akar', ARRAY['hamam', 'hamami'], 30),
	('han', 'Han', 'Inn', 'akar', ARRAY['han', 'hani', 'kervansaray'], 31),
	('bedesten', 'Bedesten ve çarşı', 'Covered market', 'akar', ARRAY['bedesten', 'bedesteni', 'carsi', 'carsisi', 'arasta', 'arastasi'], 32),
	('dukkan', 'Dükkân', 'Shop', 'akar', ARRAY['dukkan', 'dukkanlar'], 33)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "periods" ("id", "name", "name_en", "start_year", "end_year", "position") VALUES
	('bizans', 'Bizans', 'Byzantine', 330, 1453, 0),
	('selcuklu-beylikler', 'Selçuklu ve Beylikler', 'Seljuk and Beyliks', 1077, 1453, 1),
	('erken-osmanli', 'Erken Osmanlı', 'Early Ottoman', 1299, 1453, 2),
	('klasik-osmanli', 'Klasik Osmanlı', 'Classical Ottoman', 1453, 1703, 3),
	('gec-osmanli', 'Geç Osmanlı', 'Late Ottoman', 1703, 1922, 4),
	('cumhuriyet', 'Cumhuriyet', 'Republic', 1923, NULL, 5)
ON CONFLICT ("id") DO NOTHING;
