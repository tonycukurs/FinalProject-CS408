

/**
 * Initialize the application - Main entry point
 */
document.addEventListener('DOMContentLoaded', function() {
    // Set up button click handlers
    document.getElementById("send-data").addEventListener('click', addItem);
    document.getElementById("load-data").addEventListener('click', loadData);
    
    // Add a helper function to convert date formats
    document.getElementById("item-id").addEventListener('blur', function() {
        const value = this.value;
        // Check if it looks like a date with slashes (MM/DD/YYYY)
        if (value.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
            // Convert from MM/DD/YYYY to MM-DD-YYYY
            const convertedDate = value.replace(/\//g, '-');
            this.value = convertedDate;
            document.getElementById("form-status").innerHTML = 
                "Note: Date format automatically converted from slashes to hyphens";
        }
    });
    
    // Load data on page load
    loadData();
});

/**
 * Simple Function that will be run when the browser is finished loading.
 */
function loaded() {
    // Assign to a variable so we can set a breakpoint in the debugger!
    const hello = sayHello();
    console.log(hello);
}

/**
 * This function returns the string 'hello'
 * @return {string} the string hello
 */
function sayHello() {
    return 'hello';
}

/**
 * Add a new inventory item via the API
 */
function addItem() {
    let itemId = document.getElementById("item-id").value;
    let itemName = document.getElementById("item-name").value;
    let itemPrice = document.getElementById("item-price").value;
    let formStatus = document.getElementById("form-status");
    
    // Simple validation
    if (!itemId || !itemName || !itemPrice) {
        formStatus.innerHTML = "Please fill in all fields";
        return;
    }
    
    // Check for slashes in any field (especially important for dates)
    if (itemId.includes('/') || itemName.includes('/') || itemPrice.includes('/')) {
        formStatus.innerHTML = "Error: Forward slashes (/) are not allowed in any field. Please use hyphens (-) for dates instead.";
        return;
    }
    
    // Convert to number and validate
    const priceValue = parseFloat(itemPrice);
    if (isNaN(priceValue)) {
        formStatus.innerHTML = "Price must be a valid number";
        return;
    }
    
    formStatus.innerHTML = "Adding item...";
    
    // Using fetch API instead of XMLHttpRequest
    fetch("https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        mode: 'cors', // Explicitly request CORS mode
        body: JSON.stringify({
            "id": itemId,
            "price": priceValue,
            "name": itemName
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`Server returned ${response.status}: ${text}`);
            });
        }
        // Clear the form
        document.getElementById("item-id").value = "";
        document.getElementById("item-name").value = "";
        document.getElementById("item-price").value = "";
        
        // Show success message
        formStatus.innerHTML = "Item added successfully";
        
        // Reload data after sending
        loadData();
    })
    .catch(error => {
        console.error("Error adding item:", error);
        formStatus.innerHTML = "Error adding item: " + error.message;
    });
}

/**
 * Load inventory data from the API
 */
function loadData() {
    let lambda = document.getElementById("lambda-info");
    let tableBody = document.getElementById("inventory-body");
    
    lambda.innerHTML = "Loading data...";
    
    // Using fetch API instead of XMLHttpRequest
    fetch("https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items", {
        method: 'GET',
        mode: 'cors' // Explicitly request CORS mode
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json();
    })
    .then(items => {
        lambda.innerHTML = "Data loaded successfully";
        
        // Clear the table first
        tableBody.innerHTML = "";
        
        if (Array.isArray(items)) {
            if (items.length === 0) {
                lambda.innerHTML = "No items found in inventory";
            }
            
            items.forEach(item => {
                const row = document.createElement("tr");
                
                // ID cell
                const idCell = document.createElement("td");
                idCell.textContent = item.id;
                row.appendChild(idCell);
                
                // Name cell
                const nameCell = document.createElement("td");
                nameCell.textContent = item.name;
                row.appendChild(nameCell);
                
                // Price cell
                const priceCell = document.createElement("td");
                priceCell.textContent = item.price;
                row.appendChild(priceCell);
                
                // Delete button cell
                const actionCell = document.createElement("td");
                const deleteBtn = document.createElement("button");
                deleteBtn.textContent = "Delete";
                deleteBtn.className = "delete-btn";
                deleteBtn.dataset.itemId = item.id; // Store ID in data attribute
                deleteBtn.addEventListener('click', function() {
                    console.log("Delete button clicked for item:", this.dataset.itemId);
                    deleteItem(this.dataset.itemId);
                });
                actionCell.appendChild(deleteBtn);
                row.appendChild(actionCell);
                
                tableBody.appendChild(row);
            });
        } else {
            lambda.innerHTML = "Invalid data format received";
        }
    })
    .catch(error => {
        console.error("Error loading data:", error);
        lambda.innerHTML = "Error loading data: " + error.message;
    });
}

/**
 * Delete an inventory item by ID
 * @param {string} id - The ID of the item to delete
 */
function deleteItem(id) {
    console.log("Deleting item:", id); // Debug log
    document.getElementById("form-status").innerHTML = "Attempting to delete item " + id + "...";
    
    // Using fetch API instead of XMLHttpRequest for better error handling
    fetch(`https://19ia09l9t4.execute-api.us-east-2.amazonaws.com/items/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            // No need to set the Origin header - browser sets this automatically
        },
        mode: 'cors' // Explicitly request CORS mode
    })
    .then(response => {
        console.log("Delete response status:", response.status);
        if (!response.ok) {
            // If the server responds with an error status
            return response.text().then(text => {
                throw new Error(`Server returned ${response.status}: ${text}`);
            });
        }
        document.getElementById("form-status").innerHTML = "Item deleted successfully!";
        loadData(); // Reload the data
    })
    .catch(error => {
        console.error("Delete error:", error);
        document.getElementById("form-status").innerHTML = "Error deleting item: " + error.message;
    });
}