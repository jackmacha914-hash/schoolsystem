const facultyProfiles = {
  smith: `
    <h2>Mr. John Smith</h2>
    <p><strong>Department:</strong> Mathematics</p>
    <p>Mr. Smith is a passionate educator with over 15 years of experience in teaching advanced mathematics. He is dedicated to helping students discover the beauty and logic of math through engaging lessons.</p>
    <ul>
      <li>M.Ed. in Mathematics – University of Cape Town</li>
      <li>Published Author: “The Joy of Numbers”</li>
      <li>Email: jsmith@schoolname.org</li>
    </ul>
  `,
  lopez: `
    <h2>Ms. Maria Lopez</h2>
    <p><strong>Department:</strong> Science</p>
    <p>Ms. Lopez is known for making science hands-on and fun. She integrates experiments and real-world examples to spark student curiosity in biology and chemistry.</p>
    <ul>
      <li>B.Sc. in Biology – University of Nairobi</li>
      <li>STEM Club Leader & Science Fair Organizer</li>
      <li>Email: mlopez@schoolname.org</li>
    </ul>
  `,
   Abigael: `
    <h2>Ms. Abigael</h2>
    <p><strong>Department:</strong> Science</p>
    <p>Ms. Lopez is known for making science hands-on and fun. She integrates experiments and real-world examples to spark student curiosity in biology and chemistry.</p>
    <ul>
      <li>B.Sc. in Biology – University of Nairobi</li>
      <li>STEM Club Leader & Science Fair Organizer</li>
      <li>Email: mlopez@schoolname.org</li>
    </ul>
    `,
};

function openModal(id) {
  document.getElementById('modal-body').innerHTML = facultyProfiles[id];
  document.getElementById('faculty-modal').style.display = 'block';
}

function closeModal() {
  document.getElementById('faculty-modal').style.display = 'none';
}
