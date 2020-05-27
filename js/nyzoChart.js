//We create the url using the current timestamp and the timestamp from thee monts ago.
var ts = Math.round((new Date()).getTime() / 1000);
var url = `https://api.coingecko.com/api/v3/coins/nyzo/market_chart/range?vs_currency=usd&from=${ts - 7884000 * 1.1}&to=${ts}`;
//Initialize the prices and time arrays
prices = [];
time = [];
//Fetch the prices from the api
fetch(url)
    .then(function (response) {
        //Then we parse it to json format.
        return response.json();
    })
    .then(function (jsonResponse) {
        //Then we loop creating a pair of time (empty because it won't actually be displayed)
        //and price 
        for (var i = 0; i < jsonResponse['prices'].length; i++) {
            time.push('');
            prices.push(Math.floor(jsonResponse['prices'][i][1] * 100) / 100);
        }
        //Crete a gradient to fill the area under the line.
        var ctx = document.getElementById('myChart').getContext('2d');
        var gradientNyzo = ctx.createLinearGradient(0, 600, 0, 0);
        gradientNyzo.addColorStop(0, "rgba(255, 255, 255, 0)");
        gradientNyzo.addColorStop(1, "rgba(239, 124, 124, 0.4)");

        var data = {
            labels: time,
            datasets: [
                {
                    backgroundColor: gradientNyzo,
                    borderColor: 'rgba(255, 0, 0, 0.1)',
                    data: prices
                },
            ]
        };
        var myChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 50,
                        bottom: 0
                    }
                },
                scales: {
                    yAxes: [{
                        display: false,
                        ticks: {
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        display: false,
                    }]
                },
                legend: {
                    display: false,
                },
                elements: {
                    point: {
                        radius: 0,
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        });
    });

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [year, month, day].join('-');
}
