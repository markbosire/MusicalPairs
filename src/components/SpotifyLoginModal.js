import React, { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import axios from "axios";
import { useLocation, useNavigate } from "wouter";
import Home from "../Home";

const spotifyApi = new SpotifyWebApi();

const SpotifyLoginModal = () => {
  const [user, setUser] = useState(null);
  const[loading,setLoading]=useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false);


  // Load access token and refresh token from localStorage
  const accessToken = localStorage.getItem("spotifyAccessToken");
  const refreshToken = localStorage.getItem("spotifyRefreshToken");

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  async function getLyrics(songName, artist) {
    try {
      // Replace 'YOUR_MUSIXMATCH_API_KEY' with your Musixmatch API key
      const apiKey = "418389875d3bafbe34f510b649ca9091";
      
      // Make a request to Musixmatch API to get lyrics
      const response = await axios.get(
        `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?format=jsonp&callback=callback&q_track=${encodeURIComponent(
          songName
        )}&q_artist=${encodeURIComponent(artist)}&apikey=${apiKey}`
      );
      const dataString = response.data;
      const jsonData = JSON.parse(dataString.match(/callback\((.*)\)/)[1]); // Extract the JSON object within 'callback(...)'
     
        const lyrics = jsonData.message.body.lyrics.lyrics_body;
       
       
   
      
     
      
      // Split lyrics into lines
      const lines = lyrics.split(/\n/g);
       console.log(lines)
      const filteredLines = lines.filter(
        (line) => line.trim() !== "..." && !line.includes("This Lyrics is NOT for Commercial use")
      );
  
      if (filteredLines.length === 0) {
        console.error("No usable lyrics found.");
        return null;
      }
      
      // Select a random line from filtered lines
      const randomLine = filteredLines[getRandomInt(filteredLines.length)];
  
      return randomLine;
    } catch (error) {
      console.error("Error fetching lyrics:", error);
      return null;
    }
  }

  
  async function getRandomSongsFromPlaylists( numPlaylists, numSongs) {
    spotifyApi.setAccessToken(accessToken);
  
    // Step 1: Get the user's playlists
    const userPlaylistsResponse = await spotifyApi.getUserPlaylists();
    const playlists = userPlaylistsResponse.items;
  
    if (playlists.length === 0) {
      console.error("User does not have any playlists.");
      return;
    }
  
    // Determine the number of playlists to use
    const numPlaylistsToUse = Math.min(numPlaylists, playlists.length);
  
    // Step 2: Select random playlists
    const selectedPlaylists = [];
    while (selectedPlaylists.length < numPlaylistsToUse) {
      const randomIndex = getRandomInt(playlists.length);
      if (!selectedPlaylists.includes(playlists[randomIndex])) {
        selectedPlaylists.push(playlists[randomIndex]);
      }
    }
  
    // Step 3: Get random songs from selected playlists
    const randomSongs = [];
    const selectedSongNames = new Set();
    const selectedArtists = new Set();
  
    while (randomSongs.length < numSongs) {
      const randomPlaylist = selectedPlaylists[getRandomInt(numPlaylistsToUse)];
      const playlistTracksResponse = await spotifyApi.getPlaylistTracks(
        randomPlaylist.id
      );
      const tracks = playlistTracksResponse.items;
  
      const randomIndex = getRandomInt(tracks.length);
      const track = tracks[randomIndex].track;
      const songName = track.name;
      const artists = track.artists.map((artist) => artist.name).join(", ");
  
      if (!selectedSongNames.has(songName) && !selectedArtists.has(artists)) {
        const lyrics = await getLyrics(songName, artists);

        if (lyrics) {
          randomSongs.push({
            name: songName,
            artists: artists,
            lyrics: lyrics,
          });
          selectedSongNames.add(songName);
          selectedArtists.add(artists);
        }
      }
    }
  
    return randomSongs;
  }


  const checkUserLoggedIn = async () => {
    try {
  
      
      if (accessToken) {
        // Set the access token for API requests
        spotifyApi.setAccessToken(accessToken);
        const response = await spotifyApi.getMe();
       console.log(response)
        // Use the access token to get user data
        localStorage.setItem("User", JSON.stringify(response));
       
        setUser(response);

  

    // Step 2: Generate random lyrics and artist data
   

    
      } else {
        const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
  
    if(code){
      const { access_token, refresh_token } = await requestTokens();
      localStorage.setItem("spotifyAccessToken", access_token);
      localStorage.setItem("spotifyRefreshToken", refresh_token);
      
    }
    
        console.log(code)
        // User is not logged in, handle accordingly
        setIsDialogOpen(true);
      }
    } catch (error) {
     
      if (error.status === 401 && refreshToken) {
        
        // Handle token expiration by refreshing the access token
        try {
          const response = await refreshAccessToken(refreshToken);
          spotifyApi.setAccessToken(response.access_token);
          localStorage.setItem("spotifyAccessToken", response.access_token);
          localStorage.setItem("spotifyRefreshToken", refreshToken);
          const userResponse = await spotifyApi.getMe();
          setUser(userResponse);
        } catch (refreshError) {
          // Handle token refresh failure, e.g., by prompting the user to log in again.
          setIsDialogOpen(true);
        }
      } else {
        // Handle other errors as needed.
        setIsDialogOpen(true);
      }
    }
  };

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const refreshAccessToken = async (refreshToken) => {
    const clientId = "512c03864daf489c9a14d8f880b93004"; // Replace with your Spotify client ID
    const clientSecret = "17a2c6e2c5d0458dabb06ac94c0f0f22"; // Replace with your Spotify client secret
    const refreshUrl = "https://accounts.spotify.com/api/token";

    const response = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    });

    if (!response.ok) {
      throw new Error("Failed to refresh access token");
    }

    return response.json();
  };
  const requestTokens = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const clientId = "512c03864daf489c9a14d8f880b93004"; // Replace with your Spotify client ID
    const clientSecret = "17a2c6e2c5d0458dabb06ac94c0f0f22"; // Replace with your Spotify client secret
    const redirectUri = "https://musical-pairs.vercel.app/"; // Replace with your Spotify redirect URI
    const tokenUrl = "https://accounts.spotify.com/api/token";

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
    });

    if (!response.ok) {
      throw new Error("Failed to obtain access and refresh tokens");
    }

    return response.json();
  };
  const [location, navigate] = useLocation();

  const handleLogin = async () => {
    const redirectUri = "https://musical-pairs.vercel.app/"; // Replace with your Spotify redirect URI
    const scopes = ["user-top-read", "user-library-read", "user-read-private", "user-read-email"];
    const loginUrl = `https://accounts.spotify.com/authorize?client_id=512c03864daf489c9a14d8f880b93004&redirect_uri=${redirectUri}&scope=${scopes.join(
      "%20"
    )}&response_type=code`;
  


    window.location.href = loginUrl;
  };
  const handleFetchRandomSongs = async () => {
    setLoading(true)
    let randomSongsData = [];
    const numPlaylists = 3;
    const numSongs = 8;

    // Loop until randomSongsData has a length greater than 0
    while (randomSongsData.length != 8) {
      console.log("trying")
      try {
        randomSongsData = await getRandomSongsFromPlaylists(
          numPlaylists,
          numSongs
        );

        if (randomSongsData.length > 0) {
          const lyrics = randomSongsData.map((item, index) => ({
            id: index + 1,
            text: item.lyrics,
          }));
  
          const artists = randomSongsData.map((item, index) => ({
            id: index + 1,
            text: item.artists,
          }));
      
         
          localStorage.setItem("lyrics", JSON.stringify(lyrics));

          localStorage.setItem("artists", JSON.stringify(artists));

          navigate("/Home");
        } else {
          // If randomSongsData is empty, retry the fetch
          console.log("Retrying fetch...");
        }
      } catch (error) {
        console.error("Error fetching random songs:", error);
      }
    }
  };

  return (
    <div>
      {!user && (
        <Dialog
          open={isDialogOpen}
          disableBackdropClick
          disableEscapeKeyDown
          aria-labelledby="spotify-login-title"
          aria-describedby="spotify-login-description"
        >
          <DialogTitle id="spotify-login-title">Login to Spotify</DialogTitle>
          <DialogContent>
            <DialogContentText id="spotify-login-description">
              Click the button below to log in with your Spotify account and grant access to your top songs and library.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleLogin} color="primary">
              Log in with Spotify
            </Button>
          </DialogActions>
        </Dialog>
      )}

         {user && (
          <div className="landingPage">
        {loading?<img src="https://s11.gifyu.com/images/S4CQB.gif" className="loading" alt=""></img>:<div className="startBtn" onClick={handleFetchRandomSongs}>START</div>}</div>
      )}
    </div>
  );
};

export default SpotifyLoginModal;
