import json
import urllib.request

try:
    with urllib.request.urlopen("http://localhost:8000/sessions") as response:
        content = response.read()
        data = json.loads(content)
        
    print(f"Total sessions: {len(data)}")
    
    target_wa_id = "918610808451"
    found = False
    
    for session in data:
        # Check various fields where phone might be
        wa = session.get('whatsapp')
        if wa == target_wa_id:
            found = True
            print(f"Found session for {target_wa_id}")
            print(f"Keys: {list(session.keys())}")
            
            conv = session.get('conversation')
            if conv is None:
                print("conversation field is None")
            elif isinstance(conv, list):
                print(f"conversation is list of length {len(conv)}")
                if len(conv) > 0:
                    with open('keys.txt', 'w') as kf:
                        kf.write(f"First message keys: {list(conv[0].keys())}\n")
                        kf.write(f"First message raw: {str(conv[0])}\n")
                    print("Keys written to keys.txt")
            else:
                print(f"conversation is type {type(conv)}")
            break
            
    if not found:
        print(f"Session for {target_wa_id} NOT FOUND in /sessions response")

except Exception as e:
    print(f"Error: {e}")
