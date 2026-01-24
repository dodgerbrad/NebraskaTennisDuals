const scriptURL = 'https://script.google.com/macros/s/AKfycbxZKLPbLFoPwkmFe0shQJ27LeULRq5Ttg3j8mZEFTo5mlUHu19U_UU-_xZle_FD4o3yhg/exec';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('myForm');
  const logList = document.getElementById('logList');
  const clearBtn = document.getElementById('clearSession');
  const teamSelects = [document.getElementById('teams1'), document.getElementById('teams2')];

  const displayLogs = () => {
      const logs = JSON.parse(sessionStorage.getItem('dualLogs') || '[]');
      if (logList) {
          logList.innerHTML = logs.reverse().map(log => 
              `<li style="background: #f8f9fa; border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-radius: 5px;">
                  <strong>${log.winTeam}</strong> def. <strong>${log.loseTeam}</strong> (${log.scoreA}-${log.scoreB})
                  <br><small style="color: gray;">Submitted at: ${log.time}</small>
              </li>`
          ).join('');
      }
  };

  fetch(scriptURL)
      .then(response => response.json())
      .then(teams => {
          teamSelects.forEach(select => {
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

  // --- SINGLE CONSOLIDATED SUBMIT LISTENER ---
  form.addEventListener('submit', (e) => {
      e.preventDefault(); 

      const winTeam = document.getElementById('teams1').value;
      const winScoreRaw = document.getElementById('ts1').value;
      const loseTeam = document.getElementById('teams2').value;
      const loseScoreRaw = document.getElementById('ts2').value;

      // 1. Check for Empty Fields (including the "none" strings)
      if (winTeam === "none" || winScoreRaw === "none" || loseTeam === "none" || loseScoreRaw === "none" ||
          winTeam === "" || winScoreRaw === "" || loseTeam === "" || loseScoreRaw === "") {
          alert("⚠️ Please complete all selections.");
          return; 
      }

      // 2. Check for Same Team
      if (winTeam === loseTeam) {
          alert("⚠️ Error: A team cannot play itself.");
          return;
      }

      // 3. Check for Score Sum = 5
      const scoreA = parseInt(winScoreRaw);
      const scoreB = parseInt(loseScoreRaw);
      if (scoreA + scoreB !== 5) {
          alert(`⚠️ Invalid Score: Total points must be 5. Current total: ${scoreA + scoreB}`);
          return; 
      }

            // --- IF ALL CHECKS PASS, PROCEED ---
            const formData = new FormData(form);
            const newLog = {
                winTeam: winTeam,
                scoreA: scoreA,
                loseTeam: loseTeam,
                scoreB: scoreB,
                time: new Date().toLocaleTimeString()
            };
      
            // 1. POST TO GOOGLE SHEETS
            // We send the original form data to your Apps Script
            fetch(scriptURL, { method: 'POST', body: formData })
                .then(response => {
                    console.log('Success!', response);
                    alert("Submission successful!");
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert("Post to Sheet failed, but saved locally.");
                });
      
            // 2. SAVE TO SESSION STORAGE (Local Receipt)
            const currentLogs = JSON.parse(sessionStorage.getItem('dualLogs') || '[]');
            currentLogs.push(newLog);
            sessionStorage.setItem('dualLogs', JSON.stringify(currentLogs));
      
            displayLogs();
            form.reset();
      
  });

  if (clearBtn) {
      clearBtn.addEventListener('click', () => {
          sessionStorage.removeItem('dualLogs');
          displayLogs();
      });
  }

  displayLogs();
});

