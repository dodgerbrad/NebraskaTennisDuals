const form = document.getElementById('myForm');
 // Replace with your copied URL
const scriptURL = 'https://script.google.com/macros/s/AKfycbzu0zggjWSJ5AmBxLZRgdAn3Msc3BPl4FZzy3XrSjvmlvPDoshbsNhLIUs-7AVVpc3nxQ/exec';



// Function to populate dropdowns on page load
window.addEventListener('DOMContentLoaded', () => {
    fetch(scriptURL)
        .then(response => response.json())
        .then(teams => {
            const teamSelects = [document.getElementById('teams1'), document.getElementById('teams2')];
            
            teamSelects.forEach(select => {
                // Clear existing options except the first "Pick Team" option
                select.innerHTML = '<option value="none" selected disabled>Pick Team</option>';
                
                teams.forEach(teamName => {
                    const option = document.createElement('option');
                    option.value = teamName;
                    option.textContent = teamName;
                    select.appendChild(option);
                });
            });
        })
        .catch(error => console.error('Error loading teams:', error));
});



//Form Submit
form.addEventListener('submit', e => {
  e.preventDefault(); // Prevents the default form submission behavior

  // UI Feedback: Disable button and show loading state
  const submitButton = form.querySelector('input[type="submit"]');
  submitButton.disabled = true;
  submitButton.value = "Sending...";

  fetch(scriptURL, { 
    method: 'POST', 
    body: new FormData(form) 
  })
  .then(response => {
    alert('Success! Your entry has been recorded.');
    form.reset(); // Clears the form after successful submission
  })
  .catch(error => {
    console.error('Error!', error.message);
    alert('Submission failed. Please check your connection.');
  })
  .finally(() => {
    // Re-enable button regardless of success or failure
    submitButton.disabled = false;
    submitButton.value = "Submit";
  });
  if (document.activeElement) {
    document.activeElement.blur();
}
});

