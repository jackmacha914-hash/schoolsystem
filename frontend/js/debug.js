// Debug script to check if JavaScript is loading
console.log('Debug script loaded!');

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM fully loaded');
  
  // Add a visible indicator that JavaScript is working
  const body = document.body;
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.top = '10px';
  debugDiv.style.right = '10px';
  debugDiv.style.background = 'red';
  debugDiv.style.color = 'white';
  debugDiv.style.padding = '10px';
  debugDiv.style.zIndex = '9999';
  debugDiv.textContent = 'JS is working!';
  body.appendChild(debugDiv);
});
