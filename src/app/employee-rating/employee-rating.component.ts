import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-employee-rating',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-rating.component.html',
  styleUrls: ['./employee-rating.component.css']
})
export class EmployeeRatingComponent implements OnInit {
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
    this.addEmployeeForm(); // Load one form initially

    // Optional: prefill first form from route param
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.employeeForms[0].employeeId = id;
        this.loadEmployeeDetails(id, 0);
      }
    });
  }

  fetchEmployees() {
    this.http.get<any[]>('http://localhost:8080/employees').subscribe({
      next: (data) => this.employees = data,
      error: (err) => console.error('Error fetching employee list:', err)
    });
  }

  loadEmployeeDetails(id: string, index: number) {
    if (!id) return;

    this.http.get<any>(`http://localhost:8080/rating/save/${id}`).subscribe({
      next: (data) => {
        this.employeeForms[index].employeeName = data.employeeName;
        this.employeeForms[index].designation = data.designation;
        this.employeeForms[index].project_name = data.projectName;

        // Pre-fill ratings if available
        this.performanceCriteria.forEach(criteria => {
          this.employeeForms[index].formData[criteria.key] = data[criteria.key] ?? '';
        });
      },
      error: (err) => {
        console.error('❌ Failed to load employee data:', err);
        alert('Failed to fetch employee details.');
      }
    });
  }

  // ✅ Add More button - creates a new form
  addEmployeeForm() {
    this.employeeForms.push({
      employeeId: '',
      employeeName: '',
      designation: '',
      project_name: '',
      formData: this.performanceCriteria.reduce((acc, c) => ({ ...acc, [c.key]: '' }), {}),
      showRating: true,
      showSummary: false,
      isCollapsed: false
    });
  }

  // ✅ Collapse a form (hide rating content, show compact row)
  collapseForm(index: number) {
    const form = this.employeeForms[index];
    form.isCollapsed = true;
    form.showRating = false;
    
    // Show summary if any criteria are filled
    const hasAnyRatings = this.performanceCriteria.some(c => form.formData[c.key]);
    form.showSummary = hasAnyRatings;
  }

  // ✅ Expand a collapsed form (show full form)
  expandForm(index: number) {
    this.employeeForms[index].isCollapsed = false;
    this.employeeForms[index].showRating = true;
    this.employeeForms[index].showSummary = false;
  }

  // ✅ Toggle between Rating Form and Summary (only when form is expanded)
  toggleRatingSection(index: number) {
    const form = this.employeeForms[index];
    form.showRating = !form.showRating;

    if (!form.showRating) {
      // Switch to summary only if all criteria are filled
      const allRated = this.performanceCriteria.every(c => form.formData[c.key]);
      form.showSummary = allRated;
    } else {
      form.showSummary = false;
    }
    // If form is collapsed, expand it first
    // if (form.isCollapsed) {
    //   this.expandForm(index);
    //   return;
    // }
    
    // If employee is selected and form is expanded, collapse it
    // if (form.employeeId && !form.isCollapsed) {
    //   this.collapseForm(index);
    //   return;
    // }
    
    // // If no employee selected, just toggle rating visibility
    // if (!form.employeeId) {
    //   form.showRating = !form.showRating;
    //   if (!form.showRating) {
    //     form.showSummary = false;
    //   }
    // }
  }

  removeEmployeeForm(i: number) {
    this.employeeForms.splice(i, 1);
  }

  onEmployeeSelect(selectedId: string, index: number) {
    if (!selectedId) return;
    this.employeeForms[index].employeeId = selectedId;
    this.loadEmployeeDetails(selectedId, index);
  }

  onEmployeeNameSelect(selectedName: string, index: number) {
    const selectedEmp = this.employees.find(emp => emp.name === selectedName);
    if (!selectedEmp) return;
    this.employeeForms[index].employeeId = selectedEmp.id;
    this.loadEmployeeDetails(selectedEmp.id, index);
  }

  submitAll() {
    const payload = this.employeeForms.map(form => ({
      employeeId: form.employeeId,
      employeeName: form.employeeName,
      designation: form.designation,
      projectName: form.project_name,
      ...form.formData
    }));

    if (payload.some(entry => !entry.employeeId)) {
      alert('❗ Please complete all fields before submitting.');
      return;
    }

    this.http.post('http://localhost:8080/rating/save-multiple', payload).subscribe({
      next: (res) => {
        console.log('✅ Ratings submitted:', res);
        alert('All ratings submitted successfully!');
        this.employeeForms = [];
        this.addEmployeeForm();
      },
      error: (err) => {
        console.error('❌ Submission failed:', err);
        alert('Failed to submit ratings.');
      }
    });
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }
}
