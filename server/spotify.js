var db = require('../database/db');
var passport = require('passport');
var SpotifyStrategy = require('passport-spotify').Strategy;
var SpotifyWebApi = require('spotify-web-api-node');
var { clientID, clientSecret, callbackURL } = SpotifyAuth = require('./setup.js').spotifyAuth;
var spotify = new SpotifyWebApi({
  clientId: clientID,
  clientSecret: clientSecret,
  redirectUri: callbackURL
});
var userId;
var mood;
var activity;

module.exports = {
  /*
  authenticate: function(code, cb) {
    spotify.authorizationCodeGrant(code)
    .then(function(data) {
      spotify.setAccessToken(data.body.access_token);
      spotify.setRefreshToken(data.body.refresh_token);
      cb(null);
    })
    .catch(err => {
      cb(err);
    });
  },
  */
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
    spotify.reorderTracksInPlaylist(username, playlistId, 1, 3)
      .then(data => {
        cb(null);
      })
      .catch(err => {
        cb(err);
      });
  },
  searchFor: function(req, res) {
  const { name, filter } = req.query

  spotify.searchTracks(`${filter}:${name}`)
  .then(function(data) {
    let { items } = data.body.tracks;
    res.send(items)
  }, function(err) {
      console.error(err);
    });
  },
  getCategory: (req, res) => {
    spotify.getPlaylistsForCategory('mood', { limit: 50 })
    .then((data) => {
      console.log('inside get category');
      res.send(data.body.playlists.items);
    }, (err) => {
      console.log('error: ', err);
    });
  },
  setPreferences: function(req, res) {
    mood = req.body.mood;
    activity = req.body.activity;
    console.log('this is songs ', mood);
    console.log('this is songs ', activity);
    res.sendStatus(201);
  },
  getPlaylist: (req, res) => {
    db.Playlist.findAll()
    .then((result) => {
      res.send(result);
    });
  },
  createPlaylist: (req, res) => {
    console.log('post ', req.body.number);
    console.log('create playlist ', userId);
    spotify.createPlaylist(userId, 'Playlist ' + req.body.number, {public: false})
    .then((data) => {
      console.log('created Playlist ' + req.body.number);
    }, (err) => {
      console.log('error: ', err);
    });
  }
};


passport.use(new SpotifyStrategy(SpotifyAuth,
  (accessToken, refreshToken, profile, done) => {

    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);
    
    const { id, display_name, email } = profile._json;
    const user = {
      id: id, 
      name: display_name || '', 
      email: email 
    };

    userId = id;

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


