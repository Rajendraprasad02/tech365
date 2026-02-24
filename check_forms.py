
import sys
import os

# Adjust path to find backend modules
backend_path = os.path.abspath(os.path.join(os.getcwd(), '../whatsapp_integration_backend'))
if backend_path not in sys.path:
    sys.path.append(backend_path)

try:
    from app.core.database import SessionLocal
    from app.models.form import Form
except ImportError as e:
    print(f"Error importing backend modules: {e}")
    print(f"Current sys.path: {sys.path}")
    sys.exit(1)

def list_forms():
    print("Connecting to database...")
    try:
        db = SessionLocal()
        forms = db.query(Form).all()
        print(f"Found {len(forms)} forms.")
        for f in forms:
            print(f" - ID: {f.id}, Title: {f.title}")
        
        # Check specific form 101
        f101 = db.query(Form).filter(Form.id == 101).first()
        if f101:
            print("Form 101 exists.")
        else:
            print("Form 101 DOES NOT exist.")
            
        db.close()
    except Exception as e:
        print(f"Error listing forms: {e}")

if __name__ == "__main__":
    list_forms()
