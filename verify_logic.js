
// Mock of the isFieldVisible function from DynamicForm.jsx
const isFieldVisible = (field, responses) => {
    const logic = field.conditional_logic || {};
    const conditions = logic.conditions || field.conditions;

    if (!conditions || conditions.length === 0) return true;

    const allMet = conditions.every(condition => {
        const dependentFieldId = condition.field_id || condition.field;
        const dependentValue = responses[dependentFieldId];

        console.log(`Checking ${field.id}: ${dependentFieldId} (${dependentValue}) ${condition.operator} ${condition.value}`);

        switch (condition.operator) {
            case 'equals':
                return dependentValue == condition.value;
            case 'not_equals':
                return dependentValue != condition.value;
            // ... other operators ...
            default:
                return true;
        }
    });

    if (logic.action === 'hide') return !allMet;
    return allMet; // Default 'show'
};

// User's Scenario Fields
const fields = [
    {
        id: "product_type",
        label: "Product Type"
        // No conditions -> Always visible
    },
    {
        id: "m365_customer_type",
        label: "M365 Customer Type",
        conditional_logic: {
            action: "show",
            conditions: [
                { field_id: "product_type", operator: "equals", value: "M365" }
            ]
        }
    },
    {
        id: "m365_existing_license",
        label: "Existing License",
        conditional_logic: {
            action: "show",
            conditions: [
                { field_id: "m365_customer_type", operator: "equals", value: "Existing M365 Customer" }
            ]
        }
    },
    {
        id: "m365_email_migration",
        label: "Email Migration",
        conditional_logic: {
            action: "show",
            conditions: [
                { field_id: "m365_customer_type", operator: "equals", value: "New M365 Customer" }
            ]
        }
    }
];

// Test Cases
const runTest = (name, responses) => {
    console.log(`\n--- Test: ${name} ---`);
    console.log("Responses:", JSON.stringify(responses));

    fields.forEach(f => {
        const visible = isFieldVisible(f, responses);
        console.log(`Field '${f.id}' is ${visible ? 'VISIBLE' : 'HIDDEN'}`);
    });
};

// 1. Initial State (Nothing selected)
runTest("Initial State", {});

// 2. Select M365
runTest("Select M365", { product_type: "M365" });

// 3. Select Existing Customer
runTest("Select Existing Customer", {
    product_type: "M365",
    m365_customer_type: "Existing M365 Customer"
});

// 4. Select New Customer
runTest("Select New Customer", {
    product_type: "M365",
    m365_customer_type: "New M365 Customer"
});

// 5. Change Product (Should hide M365 fields)
runTest("Change Product to Google", {
    product_type: "Google Workspace",
    m365_customer_type: "Existing M365 Customer" // (Legacy value might remain in state but field should hide)
});
