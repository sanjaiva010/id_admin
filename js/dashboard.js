document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard with all students from localStorage
    initDashboard();
});

// College names for display
const collegeNames = {
    tnce: 'Tamil Nadu College of Engineering',
    pcet: 'Park College of Engineering and Technology',
    pct: 'Park College of Technology'
};

const studentData = JSON.parse(localStorage.getItem('students')) || [];

// ---- RENDER TABLE ----
function renderTable(filteredStudents) {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');

    if (!filteredStudents || filteredStudents.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    document.getElementById('pagination').style.display = 'block';

    let html = '';
    filteredStudents.forEach((student, index) => {
        const collegeName = collegeNames[student.college] || student.college;
        const bloodGroup = student.bloodGroup === 'other' ? student.otherBloodGroup || student.bloodGroup : student.bloodGroup;
        const typeText = student.studentType === 'hosteller' ? 'Hosteller' : 'Day Scholar';
        const registeredDate = student.registeredAt ? new Date(student.registeredAt).toLocaleDateString() : '-';

        html += `
            <tr class="selectable" onclick="showStudentDetail(${index})" style="cursor:pointer;">
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.regNo}</td>
                <td><span class="badge-badge badge-tnce">${collegeName}</span></td>
                <td>${student.course}</td>
                <td><span class="badge-badge badge-${student.studentType}">${typeText}</span></td>
                <td>${bloodGroup}</td>
                <td>${student.email}</td>
                <td>${student.studentPhone || '-'}</td>
                <td>${registeredDate}</td>
                <td>
                    <button class="action-btn btn-view" onclick="event.stopPropagation(); showStudentDetail(${index})">View</button>
                </td>
            </tr>`;
    });

    tbody.innerHTML = html;
}

// ---- SORT & FILTER ----
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const collegeFilter = document.getElementById('collegeFilter').value;
    const courseFilter = document.getElementById('courseFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    const allStudents = JSON.parse(localStorage.getItem('students')) || [];

    return allStudents.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm) ||
                             student.regNo.toLowerCase().includes(searchTerm) ||
                             student.email.toLowerCase().includes(searchTerm);

        const matchesCollege = !collegeFilter || student.college === collegeFilter;
        const matchesCourse = !courseFilter || student.course === courseFilter;
        const matchesType = !typeFilter || student.studentType === typeFilter;

        return matchesSearch && matchesCollege && matchesCourse && matchesType;
    });
}

// ---- EXPORT ----
function exportCSV() {
    const students = applyFilters();
    if (students.length === 0) {
        alert('No students to export after filters.');
        return;
    }

    const headers = ['ID', 'Name', 'Reg No', 'College', 'Course', 'Type', 'Blood Group', 'Email', 'Phone', 'Registered Date'];
    const rows = students.map(s => [
        s.id,
        s.name,
        s.regNo,
        collegeNames[s.college] || s.college,
        s.course,
        s.studentType === 'hosteller' ? 'Hosteller' : 'Day Scholar',
        s.bloodGroup,
        s.email,
        s.studentPhone || '-',
        s.registeredAt ? new Date(s.registeredAt).toLocaleDateString() : '-'
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-export.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportExcel() {
    exportCSV(); // Same data, different format hint
}

// ---- STATS UPDATE ----
function updateStats() {
    const allStudents = JSON.parse(localStorage.getItem('students')) || [];

    document.getElementById('dashTotal').textContent = allStudents.length;

    const tnce = allStudents.filter(s => s.college === 'tnce').length;
    const pcet = allStudents.filter(s => s.college === 'pcet').length;
    const pct = allStudents.filter(s => s.college === 'pct').length;

    document.getElementById('dashTnce').textContent = tnce;
    document.getElementById('dashPcet').textContent = pcet;
    document.getElementById('dashPct').textContent = pct;
}

// ---- INITIALIZE ----
function initDashboard() {
    // Render initial table
    renderTable(applyFilters());

    // Update stats
    updateStats();

    // Setup event listeners
    document.getElementById('searchInput').addEventListener('input', () => {
        renderTable(applyFilters());
        updatePagination(applyFilters());
    });

    document.getElementById('collegeFilter').addEventListener('change', () => {
        renderTable(applyFilters());
        updatePagination(applyFilters());
    });

    document.getElementById('courseFilter').addEventListener('change', () => {
        renderTable(applyFilters());
        updatePagination(applyFilters());
    });

    document.getElementById('typeFilter').addEventListener('change', () => {
        renderTable(applyFilters());
        updatePagination(applyFilters());
    });

    document.getElementById('exportCSV').addEventListener('click', exportCSV);
    document.getElementById('exportExcel').addEventListener('click', exportExcel);
}

// ---- PAGINATION ----
function updatePagination(filteredStudents) {
    const pageInfo = document.getElementById('pageInfo');
    const totalPages = Math.ceil(filteredStudents.length / 10) || 1;
    const currentPage = 1; // Simple: always show page 1 for dashboard

    pageInfo.innerHTML = `Showing ${filteredStudents.length} students`;

    const pagination = document.getElementById('pagination');
    pagination.innerHTML = `
        <span class="page-info">Showing ${filteredStudents.length} students</span>
    `;
}

// ---- SHOW STUDENT DETAIL ----
function showStudentDetail(index) {
    const allStudents = JSON.parse(localStorage.getItem('students')) || [];
    const student = allStudents[index];

    if (!student) return;

    const collegeName = collegeNames[student.college] || student.college;
    const bloodGroup = student.bloodGroup === 'other' ? (student.otherBloodGroup || student.bloodGroup) : student.bloodGroup;
    const typeText = student.studentType === 'hosteller' ? 'Hosteller' : 'Day Scholar';
    const registeredDate = student.registeredAt ? new Date(student.registeredAt).toLocaleDateString() : '-';
    const registeredTime = student.registeredAt ? new Date(student.registeredAt).toLocaleTimeString() : '-';

    const html = `
        <div class="detail-grid">
            <div class="detail-card">
                <h4>🆔 Student ID</h4>
                <p>${student.id}</p>
            </div>
            <div class="detail-card">
                <h4>👤 Name</h4>
                <p>${student.name}</p>
            </div>
            <div class="detail-card">
                <h4>📝 Reg No</h4>
                <p>${student.regNo}</p>
            </div>
            <div class="detail-card">
                <h4>🎓 College</h4>
                <p>${collegeName}</p>
            </div>
            <div class="detail-card">
                <h4>📚 Course</h4>
                <p>${student.course}</p>
            </div>
            <div class="detail-card">
                <h4>👥 Type</h4>
                <p>${typeText}</p>
            </div>
            <div class="detail-card">
                <h4>💊 Blood Group</h4>
                <p>${bloodGroup}</p>
            </div>
            <div class="detail-card">
                <h4>📧 Email</h4>
                <p>${student.email}</p>
            </div>
            <div class="detail-card">
                <h4>📱 Phone</h4>
                <p>${student.studentPhone || 'Not provided'}</p>
            </div>
            <div class="detail-card">
                <h4>🏠 Address</h4>
                <p>${student.address || 'Not provided'}</p>
            </div>
            <div class="detail-card">
                <h4>📞 Father's Phone</h4>
                <p>${student.dadPhone || 'Not provided'}</p>
            </div>
            <div class="detail-card">
                <h4>📅 Registered</h4>
                <p>${registeredDate}</p>
                <p>${registeredTime}</p>
            </div>
        </div>`;

    document.getElementById('detailContent').innerHTML = html;
    document.getElementById('detailModal').style.display = 'block';
}

// ---- CLOSE MODALS ----
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        document.getElementById('detailModal').style.display = 'none';
        document.getElementById('printModal').style.display = 'none';
    }
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('detailModal').style.display = 'none';
        document.getElementById('printModal').style.display = 'none';
    });
});