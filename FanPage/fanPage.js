const scriptURL = 'https://script.google.com/macros/s/AKfycbzUAhnXz6dog-UTPk5oPsTPz1Lvp-z_SGyVs4tEZBWoPnr8Y0uOWXH8oH2jb2Inwp4xag/exec';

let allData = []; 

window.addEventListener('DOMContentLoaded', () => {
    fetch(scriptURL + "?type=results")
        .then(response => response.json())
        .then(data => {
            allData = data;
            populateFilters(data);
            renderTable(data);
        });
});

function populateFilters(data) {
    const classSelect = document.getElementById('filterClass');
    const teamSelect = document.getElementById('filterTeam');

    const classes = [...new Set(data.map(item => item.Class))].filter(Boolean).sort();
    const teams = [...new Set(data.map(item => item.Teams))].filter(Boolean).sort();

    classes.forEach(c => classSelect.innerHTML += `<option value="${c}">${c}</option>`);
    teams.forEach(t => teamSelect.innerHTML += `<option value="${t}">${t}</option>`);
}

function renderTable(data) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';

    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.Teams || ''}</td>
            <td>${row.Class || ''}</td>
            <td>${row.Wins || '0'}</td>
            <td>${row.Losses || '0'}</td>
            <td>${row.WinPerc || '0%'}</td>
            <td>${row.Level || ''}</td>
            <td>${row.TotalPts || '0'}</td>
            <td>${row.PPts || '0'}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// 1. CLASS FILTER LISTENER (Updates Team Dropdown + Filters Table)
const classSelect = document.getElementById('filterClass');
const teamSelect = document.getElementById('filterTeam');

classSelect.addEventListener('change', () => {
    const selectedClass = classSelect.value;
    teamSelect.innerHTML = '<option value="all">All Teams</option>';
    
    let filteredTeams;
    if (selectedClass === 'all') {
        filteredTeams = [...new Set(allData.map(item => item.Teams))];
    } else {
        filteredTeams = [...new Set(allData
            .filter(item => item.Class === selectedClass)
            .map(item => item.Teams))];
    }
    
    filteredTeams.filter(Boolean).sort().forEach(team => {
        const option = document.createElement('option');
        option.value = team;
        option.textContent = team;
        teamSelect.appendChild(option);
    });

    applyFilters(); // Filter main table and hide/show match log
});

// 2. TEAM FILTER LISTENER (Updates Table + Fetches History)
teamSelect.addEventListener('change', () => {
    applyFilters();
});

function applyFilters() {
    const classVal = document.getElementById('filterClass').value;
    const teamVal = document.getElementById('filterTeam').value;
    const detailsContainer = document.getElementById('matchDetailsContainer');
    const detailsBody = document.getElementById('detailsBody');

    // --- PART 1: Filter the Main Summary Table (Standings) ---
    const filteredSummary = allData.filter(item => {
        const matchesClass = (classVal === 'all' || item.Class === classVal);
        const matchesTeam = (teamVal === 'all' || item.Teams === teamVal);
        return matchesClass && matchesTeam;
    });
    renderTable(filteredSummary);

    // --- PART 2: Handle Match History (Details) ---
    if (teamVal !== 'all') {
        // Show loading state while fetching from Google
        detailsContainer.classList.remove('hidden');
        document.getElementById('selectedTeamName').textContent = teamVal;
        detailsBody.innerHTML = '<tr><td colspan="5">Loading history...</td></tr>';

        fetch(scriptURL + "?type=matchDetails")
            .then(response => response.json())
            .then(matchData => {
                // Filter matches where the selected team played
                const history = matchData.filter(m => m.Winner === teamVal || m.Loser === teamVal);

                if (history.length === 0) {
                    detailsBody.innerHTML = '<tr><td colspan="5">No specific match data found for this team.</td></tr>';
                    return;
                }

                detailsBody.innerHTML = '';
                history.forEach(m => {
                    const isWinner = (m.Winner === teamVal);
                    
                    // Logic to flip data based on if selected team won or lost
                    const opponent = isWinner ? m.Loser : m.Winner;
                    const resultIndicator = isWinner ? 
                        '<span style="color:green; font-weight:bold;">W</span>' : 
                        '<span style="color:red; font-weight:bold;">L</span>';
                    
                    // Scores: Pulling from WinnerS (K) and LoserS (L)
                    const myScore = isWinner ? m.WinnerS : m.LoserS;
                    const oppScore = isWinner ? m.LoserS : m.WinnerS;
                    
                    // Levels: WinnerLevel (G) and LoserLevel (H)
                    const myLevel = isWinner ? m.LevelWinner : m.LevelLoser;
                    const oppLevel = isWinner ? m.LevelLoser : m.LevelWinner;

                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${opponent}</td>
                        <td>${resultIndicator}</td>
                        <td>${myScore} - ${oppScore}</td>
                        <td>${myLevel}</td>
                        <td>${oppLevel}</td>
                    `;
                    detailsBody.appendChild(tr);
                });
            })
            .catch(err => {
                console.error("Fetch Error:", err);
                detailsBody.innerHTML = '<tr><td colspan="5">Error loading history from Sheet3.</td></tr>';
            });
    } else {
        // If "All Teams" is selected, hide the match log
        detailsContainer.classList.add('hidden');
    }
}
