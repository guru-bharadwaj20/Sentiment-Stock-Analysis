import sys
import os

# Ensure backend/ is importable when pytest is invoked from the backend/ directory.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
