// Grades Functionality: Render Grades Chart using Chart.js
document.addEventListener("DOMContentLoaded", function () {
  renderGradesChart();
});

function renderGradesChart() {
  // Sample grade data from your detailed grades table
  const subjects = ["Math", "Science", "History"];
  const overallGrades = [88, 83, 78]; // Example overall percentages

  // Get the canvas context
  const ctx = document.getElementById("gradesChart").getContext("2d");

  // Create a bar chart for overall grades
  const gradesChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: subjects,
      datasets: [
        {
          label: "Overall Grade (%)",
          data: overallGrades,
          backgroundColor: [
            "rgba(26, 115, 232, 0.6)",
            "rgba(40, 167, 69, 0.6)",
            "rgba(243, 156, 18, 0.6)"
          ],
          borderColor: [
            "rgba(21, 88, 176, 1)",
            "rgba(33, 136, 56, 1)",
            "rgba(214, 137, 16, 1)"
          ],
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 10
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: "top"
        },
        title: {
          display: true,
          text: "Grade Trends"
        }
      }
    }
  });
}
 // Additional script for dynamic report generation //
 document.addEventListener("DOMContentLoaded", function () {
      // Variable to store the selected exam data
      let selectedExam = null;

      // Get all exam items and add click listeners to mark one as selected
      const examItems = document.querySelectorAll(".exam-item");
      examItems.forEach(item => {
        item.addEventListener("click", function () {
          // Remove "selected" class from all exam items
          examItems.forEach(i => i.classList.remove("selected"));
          // Add "selected" class to the clicked item
          this.classList.add("selected");
          // Store exam data from data attributes
          selectedExam = {
            examName: this.getAttribute("data-exam-name"),
            math: this.getAttribute("data-math"),
            science: this.getAttribute("data-science"),
            history: this.getAttribute("data-history"),
            comments: this.getAttribute("data-comments")
          };
        });
      });
      // Download Report Card Button Click Handler
      const downloadBtn = document.getElementById("download-report-btn");
      if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadReportCard);
      }

      function downloadReportCard() {
        if (!selectedExam) {
          alert("Please select an exam from the list first.");
          return;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Student Report Card", 20, 20);

        doc.setFontSize(12);
        let startY = 40;
        doc.text(`Exam: ${selectedExam.examName}`, 20, startY);
        startY += 10;
        doc.text(`Math: ${selectedExam.math}%`, 20, startY);
        startY += 10;
        doc.text(`Science: ${selectedExam.science}%`, 20, startY);
        startY += 10;
        doc.text(`History: ${selectedExam.history}%`, 20, startY);
        startY += 10;
        doc.text(`Comments: ${selectedExam.comments}`, 20, startY);

        doc.save(`${selectedExam.examName}_Report_Card.pdf`);
      }
    });
