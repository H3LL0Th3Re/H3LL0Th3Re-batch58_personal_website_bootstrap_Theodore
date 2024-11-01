// Global variable to hold the current editing project ID
let currentProjectId = null;
console.log("edit_project.js file called");

// Fetch project data and populate the form fields
async function fetchProjectData() {
    const projectId = window.location.pathname.split('/').pop(); // Get project ID from URL
    console.log("Fetching project with ID:", projectId); // Debugging line
    try {
        const response = await fetch(`/projects/${projectId}`); // Fetch project details
        if (!response.ok) {
            throw new Error(`Error fetching project: ${response.statusText}`);
        }
        const project = await response.json();

        // Populate form fields with project data
        document.getElementById('project-name').value = project.title || ''; // Set default to empty string

        // Format start_date and end_date correctly
        const startDate = new Date(project.start_date);
        const endDate = new Date(project.end_date);
        document.getElementById('start-date').value = startDate instanceof Date && !isNaN(startDate) ? startDate.toISOString().split('T')[0] : '';
        document.getElementById('end-date').value = endDate instanceof Date && !isNaN(endDate) ? endDate.toISOString().split('T')[0] : '';

        document.getElementById('description').value = project.description || '';

        // Populate technologies checkboxes
        const technologies = project.technologies || [];
        const checkboxes = document.querySelectorAll('input[type=checkbox]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = technologies.includes(checkbox.value);
        });

        currentProjectId = projectId; // Store the current project ID
    } catch (error) {
        console.error("Error fetching project:", error);
        alert("An error occurred while fetching project data. Please try again later.");
    }
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault(); // Prevent the default form submission

    const projectName = document.getElementById('project-name').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('upload-image').files[0];

    // Get checked technologies
    const technologies = Array.from(document.querySelectorAll('input[type=checkbox]:checked'))
        .map(checkbox => checkbox.value);

    // Prepare data to send to the server
    const formData = new FormData();
    formData.append('title', projectName);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);
    formData.append('description', description);
    formData.append('technologies', JSON.stringify(technologies)); // Correctly stringify technologies
    if (imageFile) {
        formData.append('image', imageFile); // Add image if available
    }

    // Send the data to the server
    try {
        const response = await fetch(`/update-project/${currentProjectId}?_method=PUT`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) {
            throw new Error(`Error updating project: ${response.statusText}`);
        }
        // Redirect to homepage after successful update
        window.location.href = '/'; // Ensure this line is reached
    } catch (error) {
        console.error("Error updating project:", error);
        alert(`An error occurred: ${error.message}`);
    }
}

// Initialize the form and set up event listener
document.addEventListener('DOMContentLoaded', () => {
    console.log("Document loaded, fetching project data...");
    fetchProjectData(); // Fetch and populate the form
    const projectForm = document.getElementById('projectForm'); // Assuming your form has this ID
    if (projectForm) {
        projectForm.addEventListener('submit', handleFormSubmit); // Set up the submit event listener
    } else {
        console.error("Project form not found! Ensure it has the correct ID.");
    }
});
