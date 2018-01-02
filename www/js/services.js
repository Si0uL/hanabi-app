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
})

.factory('socketService', function() {
    var userSocket = undefined;
    var user = undefined;

    return {
        get: function() {
            return {
                socket: userSocket,
                user: user
            };
        },
        set: function(data) {
            userSocket = data.socket;
            user = data.user;
        }
    };
});
