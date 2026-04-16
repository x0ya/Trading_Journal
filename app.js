//get all elements(divs) with class page
const pages = document.querySelectorAll('.page');
const API = 'http://localhost:3000';
let trades = [];
// Convert them from string back to array. If nothing is saved yet, start with an empty array [] note: used to be let trades = JSON.parse(localStorage.getItem('trades') || '[]');
let equityChartInstance = null; //these instances are created to store charts as without these instances the chart were piling up on each other
let winlossChartInstance = null;


function showPage(pageName) {//showPage is called with the button eg showPage('dashboard')
    pages.forEach(function(page) {
        page.style.display = 'none';//hide all the element
    });

    // highlight active button
    if (event && event.target){//Was this function called by a button click? If yes go inside. If no — like when page loads automatically — skip this block.
        document.querySelectorAll('nav button').forEach(function(btn) {
            btn.classList.remove('active');//removes this class from all the element
        });
        event.target.classList.add('active');//and adds this class on the target
    }//browser creates an event and event.target is the element on which the event is triggered

    const target = document.getElementById('page-' + pageName);
    target.style.display = 'block';//('page-' + pageName); makes (page-dashboard) which is our id
}
showPage('dashboard');//homepage

async function addTrade() {
    const symbol = document.getElementById('f-symbol').value.trim().toUpperCase();
    const type = document.getElementById('f-type').value;
    const direction = document.getElementById('f-direction').value;
    const entry = parseFloat(document.getElementById('f-entry').value);
    const exit = parseFloat(document.getElementById('f-exit').value);
    const size = parseFloat(document.getElementById('f-size').value) || 1;
    const date = document.getElementById('f-date').value;
    const notes = document.getElementById('f-notes').value;

    if (!symbol || !entry || !exit || !date) {
        alert('Please fill in required fields.');
        return;
    }

    const screenshot = await getScreenshot();

    try {
        const res = await fetch(`${API}/trades`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({symbol, type, direction, entry, exit, size, date, notes, screenshot})
        });

        if(!res.ok) {
            const err = await res.json();
            alert('Erro: ' + err.error);
            return;
        }

        const newTrade = await res.json();
        trades.unshift(newTrade);
        renderHistory();
        renderStats();
        renderChart();

        document.getElementById('f-symbol').value = '';
        document.getElementById('f-entry').value = '';
        document.getElementById('f-exit').value = '';
        document.getElementById('f-size').value = '';
        document.getElementById('f-date').value = '';
        document.getElementById('f-notes').value = '';
        document.getElementById('f-screenshot').value = '';

        const msg = document.getElementById('f-success');
        msg.classList.add('visible');
        setTimeout(function(){
            msg.classList.remove('visible');
        }, 3000);
    } catch(err) {
        console.error('Failed to save trade: ', err);
        alert('Could not connect to server');
    }

//    getScreenshot().then(function (screenshot) {//. then passes the result to the screenshot para
//         const trade = {
//         id: Date.now(),
//         symbol,
//         type,
//         direction,
//         entry,
//         exit,
//         size,
//         date,
//         notes,
//         screenshot
//     };

//     trades.push(trade);
//     localStorage.setItem('trades', JSON.stringify(trades)); //local storage can only store strings so we convert it to string
//     renderHistory(); //rebuild because a new trade was added


//     //clear form after saving
//     document.getElementById('f-symbol').value = '';
//     document.getElementById('f-entry').value = '';
//     document.getElementById('f-exit').value = '';
//     document.getElementById('f-size').value = '';
//     document.getElementById('f-date').value = '';
//     document.getElementById('f-notes').value = '';
//     document.getElementById('f-screenshot').value = '';

//     //alert
//     const msg = document.getElementById('f-success');
//     msg.classList.add('visible');
//     setTimeout(function(){
//         msg.classList.remove('visible');
//     }, 30000);
//     renderStats();
//     renderChart();

//    });

    
}

//calculate pnl
function calculatePnl(trade){
    if(trade.direction.toLowerCase() === "long") {
        return (trade.exit - trade.entry) * trade.size;
    }else{
        return (trade.entry - trade.exit) * trade.size;
    }
}

//redering history on page
function renderHistory() {
    const tbody = document.getElementById('history-body');
    
    if (trades.length === 0) {
        document.getElementById('history-empty').style.display = 'block';
        document.getElementById('history-table').style.display = 'none';
        return;
    }
    
    document.getElementById('history-empty').style.display = 'none';
    document.getElementById('history-table').style.display = 'block';
    
    tbody.innerHTML = '';//clears the tbody and prevents duplicates
    
    trades.forEach(function(trade) {
        const formattedDate = new Date(trade.date).toLocaleString();//formates the date to a nicer format
        const pnl = calculatePnl(trade);
        const win = pnl >= 0;
        //here backticks are used. backtics are used for writing strings eg `hello ${name}`.inside ${} code is considered as js and outside its string
        const row = `
            <tr>
                <td>${formattedDate}</td>
                <td>${trade.symbol}</td>
                <td>${trade.type}</td>
                <td>${trade.direction}</td>
                <td>${trade.entry}</td>
                <td>${trade.exit}</td>
                <td>${trade.size}</td>
                <td style="color:${win ? 'green' : 'red'}">${pnl.toFixed(2)}</td>
                <td>${trade.screenshot ? `<img src = "${trade.screenshot}" style="width:80px; height:50px; object-fit:cover; cursor:pointer" onclick="viewScreenshot(${trade.id})">` : `No image`}</td>
                <td> <button onclick ="deleteTrade(${trade.id})">Delete</button> </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

//delete function
//this creates the completely new array without the id which its called upon
async function deleteTrade(id){   
    try{
        await fetch(`${API}/trades/${id}`, {method: 'DELETE'});
        trades = trades.filter(function(trade) {
            return trade.id !== id;
        });
        renderHistory();
        renderStats();
        renderChart();
    } catch (err) {
        console.error('Failed to delete trade: ', err);
        alert('Could not connect to server.');
    }
    //Takes the id
    // trades = trades.filter(function (trade) {
    //     return trade.id !== id;                                 //returns all trades without the matching id
    // });
    // localStorage.setItem('trades', JSON.stringify(trades));     //updates the table
    // renderHistory();                                            //renders the updated table
    // renderStats();
    // renderChart();
}

//adding ss
function getScreenshot() {
    return new Promise(function(resolve) {
        const fileInput = document.getElementById('f-screenshot'); //stores the whole html input element
        const file = fileInput.files[0];//files stored in fileList even for single file we have to defien the index

        if (!file) { //file file is not present return null
            resolve(null);
            return;
        }

        const reader = new FileReader(); //creates a file reader

        reader.onload = function(e) { //after the below line this is fired and passes the reult to the resolve this is done in case file is read by reader too quickly and it won't have time to pass and fire this function
            resolve(e.target.result);
        };

        reader.readAsDataURL(file);//then this is fired which reads the file and convert it into base64
    });
}

//viewing ss
function viewScreenshot(id) {//fn called with trade id
    const trade = trades.find(function(t) {//find looks for exact first match and return value instead of array
        return t.id === id;
    });
    const win = window.open();//a new window is opened
    win.document.write(`<img src="${trade.screenshot}" style="max-width:100%">`);//writes this html directly onto new page
}

//Calculate stats
function renderStats() {
    if (trades.length === 0) return;// if no trades return

    const pnls = trades.map(function(trade) {
        return calculatePnl(trade);
    });

    const totalPnl = pnls.reduce(function(sum, pnl) {
        return sum + pnl;
    }, 0);

    const wins = pnls.filter(function(pnl) {
        return pnl >= 0;
    }).length;

    const winRate = (wins / trades.length) * 100;
    const avgPnl = totalPnl / trades.length;

    //updates the text content of the respective id
    document.getElementById('stat-pnl').textContent = '$' + totalPnl.toFixed(2);
    document.getElementById('stat-wr').textContent = winRate.toFixed(1) + '%';
    document.getElementById('stat-total').textContent = trades.length;
    document.getElementById('stat-avg').textContent = '$' + avgPnl.toFixed(2);
}

//Render charts
function renderChart() {
    
    //Equity Curve
    if(trades.length === 0) return;
    
    const sorted = [...trades].sort(function(a, b) {
        return new Date(a.date) - new Date(b.date);
    });//sort() sorts in accending order but as this is complex array we pass a fn which takes two para a,b a-b gets accending and b-a gets decending refer docs To sort the elements in an array without mutating the original array, use toSorted()
    
    let cumulative = 0;
    const equityData = sorted.map(function(trade) {
        const pnl = calculatePnl(trade);
        cumulative += pnl;
        return cumulative;
    });//if we don't use cm the array will retrun only pnl and when we use it its shows actual increment and decrement
    
    const labels = sorted.map(function(trade) {
        return trade.date;
    });//just a label for x axis
    
    if (equityChartInstance) equityChartInstance.destroy();
     
    equityChartInstance = 
    new Chart(document.getElementById('chart-equity'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Equity',
                data: equityData,
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 89, 0.1)',
                fill: true,//color below the line
                tension: 0.3//curvature
            }]
        },
        options: {
            responsive: true//responsive to all window sizes
        }
    });

    //Win and loss
    const wins = trades.filter(function(trade) {
        return calculatePnl(trade) >= 0;
    }).length;//Stores the length of wining trade

    const losses = trades.length - wins;//substracts the wins from total
    if (winlossChartInstance) winlossChartInstance.destroy();
    
    winlossChartInstance = 
    new Chart(document.getElementById('chart-winloss'), {//chart functions takes to args first is location of canvas and second is instructions
        type: 'doughnut',
        data: {
            labels: ['Wins', 'Losses'],
            datasets: [{
                data: [wins, losses],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.7)',
                    'rgba(244, 67, 54, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}


// renderHistory();//rednders table on startup. rebuild on page load to show saved trades
// renderStats();
// renderChart();

async function loadTrades() {
    try {
        const res = await fetch(`${API}/trades`);
        trades = await res.json();
        renderHistory();
        renderStats();
        renderChart();
    } catch (err) {
        console.error('Failed to load trades: ', err);
    }
}

loadTrades();