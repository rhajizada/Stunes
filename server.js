// jshint esversion: 9
const express = require('express');
const app = express();
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

/*
    I recommend putting all your configuration
    settings into environment variables
*/
const ip = process.env.IP; // Enter servers ip address
const PORT = process.env.PORT;

// API Stuff
const ClientID = process.env.ClientID; // Enter Spotify App Client ID
const ClientSecret = process.env.ClientSecret; // Enter Spotify App Client Secret

// Middlewares
app.use(express.static('public'));
app.use(express.json());
// Routes 
app.get('/login', (req, res) => {
    let scopes = ['playlist-read-private'];
    let redirect_uri = `${ip}/token`;
    res.redirect('https://accounts.spotify.com/authorize' +
        '?response_type=code' +
        '&client_id=' + ClientID +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
        '&redirect_uri=' + encodeURIComponent(redirect_uri));
});


app.get('/token',(req, res) => {
    let redirect_uri = `${ip}/token`;
    const fetchToken = async (code) => {
        const basic = Buffer.from(`${ClientID}:${ClientSecret}`).toString('base64');
        let response = await fetch("https://accounts.spotify.com/api/token", {
            body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirect_uri)}`,
            headers: {
              Authorization: `Basic ${basic}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST"
          });
        let json = await response.json();
        return json;
    };
    fetchToken(req.query.code).then((json) => {
        res.cookie('access_token', json.access_token, { expires: new Date(Date.now() + json.expires_in)});
        res.cookie('token_type', json.token_type, {expires: new Date(Date.now() + json.expires_in)});
        res.cookie('refresh_token', json.refresh_token, {expires: new Date(Date.now() + json.expires_in)});
        res.cookie('scope', json.scope, {expires: new Date(Date.now() + json.expires_in)});
        res.redirect(302, ip);
    }).catch((error) => {
        console.log(error);
        res.redirect(302, ip);
    });
});

app.post('/playlists/:token', async (req, res) => {
    const token = req.params.token;
    let playlists = [];
    const getNumberOfPlaylists = async (token) => {
        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const json = await response.json();
        const number = json.total;
        return number;
    };
    const getPlaylistObjects = async (token, number) => {
        const response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=${number}&offset=0`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const json = await response.json();
        return json.items;
    };
    const getTracklist = async (token, playlist_id, offset, limit) => {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?market=US&fields=items(added_by.id%2Ctrack(name%2Calbum%2Cartists))&limit=${limit}&offset=${offset}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const json = await response.json();
        return json.items;
    };
    const getOffsetArray = (number) => {
        const hundreds = Math.floor(number/100);
        const decimals = number - 100*hundreds;
        let offset_array = [];
        for(let i = 0; i < hundreds; i++ ){
            offset_array.push({
                offset: i*100,
                limit: 100
            });
        }
        offset_array.push({
            offset: hundreds*100,
            limit: decimals+1
        });
        return offset_array;
    };
    const numberOfPlaylists = await getNumberOfPlaylists(token);
    const playlistsMeta = await getPlaylistObjects(token, numberOfPlaylists);
    playlistsMeta.forEach(async playlist => {
        playlist.offset = (getOffsetArray(playlist.tracks.total));
      });

    for(let playlistMeta of playlistsMeta){
        let tracklist_array = [];
        for(let offset of playlistMeta.offset){
            tracklist_array = [...tracklist_array, ...await getTracklist(token, playlistMeta.id, offset.offset, offset.limit)];
        }
        playlists.push({
            meta: playlistMeta,
            tracklist: tracklist_array
        });
    }

    if (playlistsMeta.error) {
        console.log('error');
        res.status(500).send('Server failed fetching playlists');
    } else {
        res.json(playlists);
    }

});

app.listen(PORT, () => {
    console.log(`Server started on ${ip}`);
});
