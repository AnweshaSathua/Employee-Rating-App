import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-rating',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './employee-rating.component.html',
  styleUrls: ['./employee-rating.component.css']
})
export class EmployeeRatingComponent implements OnInit {
submitForm() {
throw new Error('Method not implemented.');
}
  ratings = [1, 2, 3, 4, 5];

  performanceCriteria = [
    { key: 'communication', label: '💬Communication' },
    { key: 'punctuality', label: '⏰Punctuality' },
    { key: 'task_allocation', label: '📋Task Allocation' },
    { key: 'teamwork', label: '🤝Teamwork' },
    { key: 'adaptability', label: '🔄Adaptability' },
    { key: 'quantity_and_quality', label: '📊Quantity and Quality' }
  ];

  employees: any[] = [];

  employeeForms: any[] = [];

  isDarkMode = false;

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const storedTheme = localStorage.getItem('theme');
    this.isDarkMode = storedTheme === 'dark';
    document.body.classList.toggle('dark-mode', this.isDarkMode);

    this.fetchEmployees();
    this.addEmployeeForm(); // Add default form on init
  }

  fetchEmployees() {
    this.http.get<any[]>('http://localhost:8080/employees').subscribe({
      next: (data) => {
        this.employees = data;
      },
      error: (err) => {
        console.error('Error fetching employee list:', err);
      }
    });
  }


  currentIndex = 0;

goToPreviousCard() {
  if (this.currentIndex > 0) {
    this.currentIndex--;
  }
}

goToNextCard() {
  if (this.currentIndex < this.employeeForms.length - 1) {
    this.currentIndex++;
  }
}

  addEmployeeForm() {
    this.employeeForms.push({
      employeeId: '',
      employeeName: '',
      designation: '',
      project_name: '',
      formData: {}
    });
    this.currentIndex = this.employeeForms.length - 1; 
  }

    removeEmployeeForm(i: number) {
  this.employeeForms.splice(i, 1);
  if (this.currentIndex >= this.employeeForms.length) {
    this.currentIndex = this.employeeForms.length - 1;
  }
}


  onEmployeeSelect(selectedId: string, index: number) {
    if (!selectedId) return;

    this.http.get<any>(`http://localhost:8080/rating/save/${selectedId}`).subscribe({
      next: (data) => {
        this.employeeForms[index].employeeName = data.employeeName;
        this.employeeForms[index].designation = data.designation;
        this.employeeForms[index].project_name = data.projectName;

        // Initialize criteria values
        this.performanceCriteria.forEach(criteria => {
          this.employeeForms[index].formData[criteria.key] = data[criteria.key] ?? null;
        });
      },
      error: (err) => {
        console.error('❌ Failed to fetch employee details:', err);
        alert('Failed to fetch employee details.');
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  submitAll() {
    const payload = this.employeeForms.map(form => ({
      employeeId: form.employeeId,
      ...form.formData
    }));

    if (payload.some(entry => !entry.employeeId || Object.values(entry).some(val => val === null))) {
      alert('❗ Please complete all fields before submitting.');
      return;
    }

    this.http.post('http://localhost:8080/rating/save-multiple', payload).subscribe({
      next: (res) => {
        console.log('✅ Ratings submitted:', res);
        alert('All ratings submitted successfully!');
      },
      error: (err) => {
        console.error('❌ Submission failed:', err);
        alert('Failed to submit ratings.');
      }
    });
  }
}
