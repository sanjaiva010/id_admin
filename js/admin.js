document.addEventListener('DOMContentLoaded', function() {
    const startScanBtn = document.getElementById('startScan');
    const stopScanBtn = document.getElementById('stopScan');
    const manualScanBtn = document.getElementById('manualScan');
    const clearBtn = document.getElementById('clearDetails');
    const manualInput = document.getElementById('manualInput');
    const studentDetails = document.getElementById('studentDetails');
    const scanHistory = document.getElementById('scanHistory');

    // Stats elements
    const totalScansEl = document.getElementById('totalScans');
    const tnceCountEl = document.getElementById('tnceCount');
    const pcetCountEl = document.getElementById('pcetCount');
    const pctCountEl = document.getElementById('pctCount');

    let html5QrCode = null;
    let scannedStudents = [];

    // Load persisted scan stats from localStorage
    function loadScanStats() {
        const stats = JSON.parse(localStorage.getItem('scanStats')) || {
            total: 0,
            tnce: 0,
            pcet: 0,
            pct: 0
        };
        updateStatsDisplay(stats);
        return stats;
    }

    // Save scan stats to localStorage
    function saveScanStats(stats) {
        localStorage.setItem('scanStats', JSON.stringify(stats));
    }

    // Update stats display
    function updateStatsDisplay(stats) {
        totalScansEl.textContent = stats.total;
        tnceCountEl.textContent = stats.tnce;
        pcetCountEl.textContent = stats.pcet;
        pctCountEl.textContent = stats.pct;
    }

    // Initialize scanner
    function initScanner() {
        html5QrCode = new Html5Qrcode("reader");
    }

    // Start scanning
    startScanBtn.addEventListener('click', function() {
        if (!html5QrCode) {
            initScanner();
        }

        html5QrCode.start(
            { facingMode: "environment" },
            {
                fps: 10,
                qrbox: { width: 250, height: 250 }
            },
            onScanSuccess,
            onScanFailure
        ).then(() => {
            startScanBtn.style.display = 'none';
            stopScanBtn.style.display = 'inline-block';
        }).catch(err => {
            alert('Unable to start camera. Please ensure camera permissions are granted.\n\nError: ' + err);
        });
    });

    // Stop scanning
    stopScanBtn.addEventListener('click', function() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                startScanBtn.style.display = 'inline-block';
                stopScanBtn.style.display = 'none';
            }).catch(err => {
                console.error('Error stopping scanner:', err);
            });
        }
    });

    // Handle successful scan
    function onScanSuccess(decodedText) {
        try {
            // Stop scanner after successful scan
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop();
                startScanBtn.style.display = 'inline-block';
                stopScanBtn.style.display = 'none';
            }

            // Parse QR data
            const studentData = JSON.parse(decodedText);
            displayStudentDetails(studentData);
            addToHistory(studentData);
            updateScanStats(studentData);
        } catch (error) {
            alert('Invalid QR code format. Please scan a valid student QR code.');
        }
    }

    // Handle scan failure
    function onScanFailure(error) {
        // Silently handle scan failures (continuous scanning)
    }

    // Update scan statistics
    function updateScanStats(data) {
        const stats = loadScanStats();
        stats.total++;

        const collegeShort = data.college;
        if (collegeShort === 'TNCE') stats.tnce++;
        else if (collegeShort === 'PCET') stats.pcet++;
        else if (collegeShort === 'PCT') stats.pct++;

        saveScanStats(stats);
        updateStatsDisplay(stats);
    }

    // Manual entry processing
    manualScanBtn.addEventListener('click', function() {
        const inputData = manualInput.value.trim();
        if (!inputData) {
            alert('Please paste QR code data first.');
            return;
        }

        try {
            const studentData = JSON.parse(inputData);
            displayStudentDetails(studentData);
            addToHistory(studentData);
            updateScanStats(studentData);
            manualInput.value = '';
        } catch (error) {
            alert('Invalid JSON data. Please paste valid QR code data.');
        }
    });

    // Display student details - SIMPLIFIED
    function displayStudentDetails(data) {
        // Find full college name
        let collegeName = data.college;
        for (const key in collegesData) {
            if (collegesData[key].shortName === data.college) {
                collegeName = collegesData[key].name;
                break;
            }
        }

        // Find full course name
        let courseName = data.course;
        const collegeKey = Object.keys(collegesData).find(k => 
            collegesData[k].shortName === data.college
        );
        if (collegeKey) {
            const course = collegesData[collegeKey].courses.find(c => c.code === data.course);
            if (course) {
                courseName = `${data.course} - ${course.name}`;
            }
        }

        // Update display - only name, college, course
        document.getElementById('detailName').textContent = data.name;
        document.getElementById('detailCollege').textContent = collegeName;
        document.getElementById('detailCourse').textContent = courseName;
        document.getElementById('scanTime').textContent = `Scanned at ${new Date().toLocaleTimeString()}`;

        // Show details section
        studentDetails.style.display = 'block';
        studentDetails.scrollIntoView({ behavior: 'smooth' });

        // Play success sound
        playSuccessSound();
    }

    // Add to scan history
    function addToHistory(data) {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        
        // Find college short name for display
        let collegeShort = data.college;
        for (const key in collegesData) {
            if (collegesData[key].shortName === data.college) {
                collegeShort = collegesData[key].shortName;
                break;
            }
        }

        scannedStudents.unshift({
            ...data,
            scanTime: timeString,
            collegeDisplay: collegeShort
        });

        // Keep only last 10 scans
        if (scannedStudents.length > 10) {
            scannedStudents.pop();
        }

        updateHistoryDisplay();
    }

    // Update history display
    function updateHistoryDisplay() {
        if (scannedStudents.length === 0) {
            scanHistory.innerHTML = '<p class="no-scans">No scans yet</p>';
            return;
        }

        scanHistory.innerHTML = scannedStudents.map(student => `
            <div class="history-item">
                <div class="history-info">
                    <strong>${student.name}</strong>
                    <span class="history-detail">${student.collegeDisplay} | ${student.course}</span>
                </div>
                <span class="history-time">${student.scanTime}</span>
            </div>
        `).join('');
    }

    // Clear details
    clearBtn.addEventListener('click', function() {
        studentDetails.style.display = 'none';
        document.getElementById('detailName').textContent = '';
        document.getElementById('detailCollege').textContent = '';
        document.getElementById('detailCourse').textContent = '';
        document.getElementById('scanTime').textContent = '';
    });

    // Play success sound
    function playSuccessSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.3;
            
            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 150);
        } catch (e) {
            // Audio not supported, silently fail
        }
    }

    // Initialize
    loadScanStats();
});