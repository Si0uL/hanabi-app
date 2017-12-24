angular.module('hanabi.services', [])

.factory('gameService', function() {

    var gameData = undefined;

    return {
        get: function() {
            return gameData;
        },
        set: function(data) {
            gameData = data;
        }
    };
});
