var request = require('request');
var requestPromise = require('request-promise');
var db = require('../database/db');
var trackSelector = require('./trackSelector');
var passport = require('passport');
var SpotifyStrategy = require('passport-spotify').Strategy;
var SpotifyWebApi = require('spotify-web-api-node');
var { clientID, clientSecret, callbackURL } = SpotifyAuth = require('./setup.js').spotifyAuth;
var spotify = new SpotifyWebApi({
  clientId: clientID,
  clientSecret: clientSecret,
  redirectUri: callbackURL
});

module.exports = {
  getUserPlaylists: function(username, cb) {
    spotify.getUserPlaylists(username)
      .then(data => {
        cb(null, data.body);
      })
      .catch(err => {
        cb(err, null);
      });
  },  

  getPlaylist: function(username, playlistId, cb) {
    spotify.getPlaylistTracks(username, playlistId)
      .then(data => {
        cb(null, data.body);
      })
      .catch(err => {
        cb(err, null);
      });
  },

  moveTrack: function(username, playlistId, cb) {
    // var options = { 'range_length': 2 };
    var i1 = Math.floor(Math.random()*10);
    var i2 = Math.floor(Math.random()*10);
    spotify.reorderTracksInPlaylist(username, playlistId, i1, i2)
      .then(data => {
        cb(null);
      })
      .catch(err => {
        cb(err);
      });
  },

  searchFor: function(name, filter, cb) {
    spotify.searchTracks(`${filter}:${name}`)
    .then((data) => {
      let { items } = data.body.tracks;
      cb(null, items);
    })
    .catch((err) => {
        console.error(err);
        cb(err)
      });
  },

  getName: (req, res) => {
    res.send(req.user.name);
  },

  createPlaylist: function(userId, preferences, cb) {
    // TODO: change playlist name to timestamp
    var playlistName = 'TODO';
    // console.log(userId, preferences);
    spotify.createPlaylist(userId, playlistName, {public: false})
      .then(data => {
        console.log('new playlist id', data.body.id);
        // go get tracks for playlist
        spotify.getPlaylistsForCategory('mood', { limit: 50 })
          .then(playlists => {
            trackSelector(playlists.body.playlists.items);
            // playlists.body.playlists.items
          })



        this.getCategory(req.body.mood, req.body.activity)
          .then(something => {
            // dbHelpers.savePlaylist with tracks
            // send response
          })
          .catch(err => {
            console.log(err);
          })
        console.log('created Playlist :', data.body.external_urls.spotify);
        // res.sendStatus(201);
      }, (err) => {
        console.log('error: ', err);
        // wrong status
        // res.sendStatus(404);
      });
  },

  getCurrentSongDetails: (req, res) => {
    if (spotify._credentials.accessToken) {
      const options = {
        uri: 'https://api.spotify.com/v1/me/player',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${spotify._credentials.accessToken}`
        },
        json: true
      }; 
      requestPromise(options)
      .then(info => {
        res.send(info);
      })
      .catch(err => console.log('getCurrentSongDetails err: ', err));
    } else {
      /* FUTURE TODO: Should logs out the user when access token expired or server restarted.
      // For logout
      req.logOut();
      req.session.destroy();

      // For refreshing approach
      spotify.refreshAccessToken()
      .then(data => {
        // Save the access token so that it's used in future calls
        spotify.setAccessToken(data.body['access_token']);
        console.log('The access token has been refreshed!');
      }, err => {
        console.log('Could not refresh access token', err);
      });
      */
    }
  }
};




passport.use(new SpotifyStrategy(SpotifyAuth,
  (accessToken, refreshToken, profile, done) => {

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);
    console.log(spotify);
    
    const { id, display_name, email } = profile._json;
    const user = {
      id: id, 
      name: display_name || '', 
      email: email 
    };

    clientName = display_name;

    db.User.findOne({where: {id: id}})
    .then(result => {
      if (!result) {
        db.User.create(user)
        .then(result => {
          return done(null, result.dataValues);
        })
        .catch(err => console.log('User.create err: ', err));
      } else {
        return done(null, result.dataValues);        
      }    
    })
    .catch(err => {
      console.log('spotifyAuthentication catch error: ', err);      
    });    
  }) 
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  db.User.findOne({where: {id: id}})
  .then(result => {
    return done(null, result.dataValues);
  })
  .catch(err => {
    console.log('passport.deserializeUser err: ', err);
  });
});


