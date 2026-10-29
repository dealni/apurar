"""Gate local Python sem rede nem dados grandes; retorna falha em regressão."""

import ast
import sys
import unittest
from pathlib import Path

root = Path(__file__).resolve().parent
sys.path.insert(0, str(root))
for source in (root / "apurar_collector").rglob("*.py"):
    ast.parse(source.read_text(), filename=str(source))
suite = unittest.defaultTestLoader.discover(
    str(root / "tests"), top_level_dir=str(root)
)
if suite.countTestCases() == 0:
    raise SystemExit("Nenhum teste Python encontrado; gate interrompido.")
result = unittest.TextTestRunner(verbosity=1).run(suite)
raise SystemExit(0 if result.wasSuccessful() else 1)
