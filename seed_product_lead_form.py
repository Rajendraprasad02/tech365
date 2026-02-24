
import requests
import json
import sys
import os

# Configuration
API_URL = "http://localhost:3300/api/forms" 

# Define the Form Payload matching the User's Request
form_payload = {
    "name": "Product Lead Capture Form",
    "description": "Dynamic multi-screen form for product leads.",
    "schema": {
        "screens": [
            {
                "id": "screen_basic_details",
                "title": "Basic Details",
                "fields": [
                    {
                        "id": "first_name",
                        "type": "text",
                        "label": "First Name",
                        "required": True,
                        "placeholder": "Enter First Name"
                    },
                    {
                        "id": "last_name",
                        "type": "text",
                        "label": "Last Name",
                        "required": True,
                        "placeholder": "Enter Last Name"
                    },
                    {
                        "id": "phone",
                        "type": "number", # Phone often treated as text or number
                        "label": "Phone",
                        "required": True,
                        "placeholder": "Enter Phone Number"
                    },
                    {
                        "id": "email",
                        "type": "text",
                        "label": "Email",
                        "required": True,
                        "placeholder": "Enter Email",
                        "validation_rules": {
                            "regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                            "errorMessage": "Invalid email address"
                        }
                    },
                    {
                        "id": "company_name",
                        "type": "text",
                        "label": "Company Name",
                        "required": True,
                        "placeholder": "Enter Company Name"
                    },
                    {
                        "id": "product_type",
                        "type": "select",
                        "label": "Select Product",
                        "required": True,
                        "options": [
                            {"label": "M365", "value": "M365"},
                            {"label": "Google Workspace", "value": "Google Workspace"},
                            {"label": "Desktops", "value": "Desktops"},
                            {"label": "Laptops", "value": "Laptops"},
                            {"label": "Server", "value": "Server"},
                            {"label": "Storage", "value": "Storage"},
                            {"label": "Switches", "value": "Switches"},
                            {"label": "Accessories", "value": "Accessories"},
                            {"label": "Monitor", "value": "Monitor"},
                            {"label": "Cloud", "value": "Cloud"}
                        ]
                    }
                ]
            },
            {
                "id": "screen_product_details",
                "title": "Product Details",
                "fields": [
                    # --- M365 SECTION ---
                    {
                        "id": "m365_customer_type",
                        "type": "radio",
                        "label": "M365 Customer Type",
                        "options": ["Existing M365 Customer", "New M365 Customer"],
                        "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "equals", "value": "M365"}]
                        }
                    },
                    {
                        "id": "m365_existing_license",
                        "type": "select",
                        "label": "What type of License and Quantity?",
                        "options": ["Business Basic", "Business Standard", "Business Premium", "E3", "E5", "Copilot"],
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "m365_customer_type", "operator": "equals", "value": "Existing M365 Customer"}]
                        }
                    },
                    {
                        "id": "m365_email_hosting",
                        "type": "text",
                        "label": "Where are you currently hosting your Email?",
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "m365_customer_type", "operator": "equals", "value": "New M365 Customer"}]
                        }
                    },
                    {
                        "id": "m365_email_migration",
                        "type": "select",
                        "label": "Do you need Email Migration?",
                        "options": ["Business Basic", "Business Standard", "Business Premium", "E3", "E5", "Copilot"],
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "m365_customer_type", "operator": "equals", "value": "New M365 Customer"}]
                        }
                    },

                     # --- GOOGLE WORKSPACE SECTION ---
                    {
                        "id": "gsuite_customer_type",
                        "type": "radio",
                        "label": "Google Workspace Customer Type",
                        "options": ["Existing G-Suite Customer", "New G-Suite Customer"],
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "equals", "value": "Google Workspace"}]
                        }
                    },
                    {
                        "id": "gsuite_existing_license",
                        "type": "select",
                        "label": "What type of License and Quantity?",
                        "options": ["Starter", "Standard", "Plus", "Enterprise"],
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "gsuite_customer_type", "operator": "equals", "value": "Existing G-Suite Customer"}]
                        }
                    },
                     {
                        "id": "gsuite_email_hosting",
                        "type": "text",
                        "label": "Where are you currently hosting your Email?",
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "gsuite_customer_type", "operator": "equals", "value": "New G-Suite Customer"}]
                        }
                    },
                    {
                        "id": "gsuite_email_migration",
                        "type": "select",
                        "label": "Do you need Email Migration?",
                        "options": ["Starter", "Standard", "Plus", "Enterprise"],
                         "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "gsuite_customer_type", "operator": "equals", "value": "New G-Suite Customer"}]
                        }
                    },

                    # --- DESKTOPS / LAPTOPS SECTION ---
                    # Logic: product_type == Desktops OR product_type == Laptops
                    # Simplified for this specific requirement: Create fields for both, or use multi-condition if backend supports OR logic in one group. 
                    # Our current logic engine is implicitly AND. To support OR, we might need multiple rules or update engine.
                    # HACK: For now, I will add DUPLICATE fields for Desktops and Laptops OR better yet, let's assumes Backend supports 'contains' operator or create separate blocks.
                    # User requirement said "IF product_type == Desktops OR Laptops".
                    # Let's check DynamicForm logic... it iterates conditions and returns allMet (AND).
                    # To do OR, we'd need separate conditional blocks or 'in' operator.
                    # I will implement 'in' operator support in DynamicForm to be robust.
                    
                    {
                        "id": "device_make",
                        "type": "text",
                        "label": "Make",
                        "conditional_logic": {
                            "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "in", "value": ["Desktops", "Laptops"]}]
                        }
                    },
                    {
                        "id": "device_model",
                        "type": "text",
                        "label": "Model",
                        "conditional_logic": {
                             "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "in", "value": ["Desktops", "Laptops"]}]
                        }
                    },
                    {
                        "id": "device_memory",
                        "type": "text",
                        "label": "Memory",
                         "conditional_logic": {
                             "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "in", "value": ["Desktops", "Laptops"]}]
                        }
                    },
                    {
                        "id": "device_storage",
                        "type": "text",
                        "label": "Storage / SSD",
                         "conditional_logic": {
                             "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "in", "value": ["Desktops", "Laptops"]}]
                        }
                    },
                    {
                        "id": "touchscreen",
                        "type": "radio",
                        "label": "Touchscreen?",
                        "options": ["Yes", "No"],
                         "conditional_logic": {
                             "action": "show",
                            "conditions": [{"field_id": "product_type", "operator": "in", "value": ["Desktops", "Laptops"]}]
                        }
                    },

                    # --- SERVER SECTION ---
                    { "id": "server_make", "type": "text", "label": "Make", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Server" }] } },
                    { "id": "server_model", "type": "text", "label": "Model", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Server" }] } },
                    { "id": "server_memory", "type": "text", "label": "Memory", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Server" }] } },
                    { "id": "server_cpu", "type": "text", "label": "CPU", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Server" }] } },
                    { "id": "server_gpu", "type": "text", "label": "GPU", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Server" }] } },
                    { "id": "server_internal_storage", "type": "text", "label": "Internal Storage", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Server" }] } },

                     # --- STORAGE SECTION ---
                    {
                        "id": "storage_type", "type": "radio", "label": "Storage Type", "options": ["NAS", "SAN"],
                        "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Storage" }] }
                    },
                    { "id": "storage_make", "type": "text", "label": "Make", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Storage" }] } },
                    { "id": "storage_model", "type": "text", "label": "Model", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Storage" }] } },
                    { "id": "storage_capacity", "type": "text", "label": "Storage Capacity", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Storage" }] } },

                    # --- SWITCHES SECTION ---
                    { "id": "switch_make_model", "type": "text", "label": "Switch – Make & Model", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Switches" }] } },
                    { "id": "switch_ports", "type": "number", "label": "Number of Ports", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Switches" }] } },

                    # --- ACCESSORIES SECTION ---
                    { 
                        "id": "accessories", "type": "checkbox", "label": "Select Accessories", 
                        "options": ["Keyboard", "Mouse", "Dock", "Webcam", "Privacy Screen"],
                        "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Accessories" }] } 
                    },

                     # --- MONITOR SECTION ---
                    { "id": "monitor_make", "type": "text", "label": "Make", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Monitor" }] } },
                    { "id": "monitor_model", "type": "text", "label": "Model", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Monitor" }] } },
                    { "id": "monitor_size", "type": "text", "label": "Size", "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Monitor" }] } },

                    # --- CLOUD SECTION ---
                     { 
                        "id": "cloud_provider", "type": "radio", "label": "Cloud Provider", "options": ["AWS", "Azure", "GCP"],
                        "conditional_logic": { "action": "show", "conditions": [{ "field_id": "product_type", "operator": "equals", "value": "Cloud" }] } 
                    }
                ]
            }
        ]
    }
}

def seed_form():
    try:
        print(f"Creating form: {form_payload['name']}...")
        response = requests.post(API_URL, json=form_payload)
        
        if response.status_code == 200 or response.status_code == 201:
            print("Form created successfully!")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"Failed to create form. Status: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to Backend API. Make sure 'python main.py' is running.")

if __name__ == "__main__":
    seed_form()
