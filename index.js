var axios = require('axios');

function runGame() {
    return axios.get('http://www.dragonsofmugloar.com/api/game')
        .then(function (game) {
            return axios.get('http://www.dragonsofmugloar.com/weather/api/report/' + game.data.gameId)
                .then(function (weather) {
                    return {
                        game: game.data,
                        weather: weather.data
                    }
                })
        })
        .then(function ({game, weather}) {
            var knight = game.knight;
            var dragon = {};
            var knightDragonMapping = {
                attack: 'scaleThickness',
                armor: 'clawSharpness',
                agility: 'wingStrength',
                endurance: 'fireBreath'
            }

            delete knight.name;

            if (weather.indexOf('HVA')>-1) {
                // Heavy rain: clawSharpness 10 and fireBreath 0
                return {
                    dragon:{
                        'scaleThickness': 5,
                        'clawSharpness': 10,
                        'wingStrength': 5,
                        'fireBreath': 0
                    },
                    gameId: game.gameId
                }
            } else if (weather.indexOf('T E')>-1) {
                // Long dry: dragon's stats have to be balanced
                return {
                    dragon:{
                        'scaleThickness': 5,
                        'clawSharpness': 5,
                        'wingStrength': 5,
                        'fireBreath': 5
                    },
                    gameId: game.gameId
                }
            } else if (weather.indexOf('SRO')>-1) {
                // Storm: dragon doesn't show up
                return {
                    gameId: game.gameId
                }
            }

            Object.keys(knight).sort(function (b, a) {
                return knight[a] - knight[b]
            }).forEach(function (knightAttributeName, index) {
                var value = knight[knightAttributeName];
                var dragonAttributeName = knightDragonMapping[knightAttributeName];

                if (index === 0) {
                    value += 2;
                } else if (index === 1 || index === 2) {
                    value -= 1;
                }

                dragon[dragonAttributeName] = value;
            })
            return {dragon: dragon, gameId: game.gameId};
        }).then(function ({dragon, gameId}) {
        return axios.put('http://www.dragonsofmugloar.com/api/game/' + gameId + '/solution', {dragon: dragon});
    }).then(function ({data}) {
        if (data.status === 'Victory'){
            console.log(data);
            return 1;
        } else {
            console.log(data);
            return 0;
        }
    })
}

var games = [];
for (var i=0; i<10; i++) {
    games.push(runGame());
}
Promise.all(games).then(function (games) {
    var gamesWon = games.reduce(function (memo, value) {
        return memo+value;
    })
    console.log('Games won: ' + gamesWon + ' out of 10.');
})
