"""Finalize and verify the actual delivery sequentially, then render close-ups."""
from pathlib import Path
P=Path(__file__).parent
for filename in ('finalize_export.py','check_junctions.py','validate_v22.py','render_details.py'):
 path=P/filename
 exec(compile(path.read_text(),str(path),'exec'),{'__file__':str(path),'__name__':'__main__'})
