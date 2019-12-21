<script>
export let playlist;
const saveCSV = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (csv, filename) {
        let blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

const saveJSON = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (json, filename) {
        let blob = new Blob([json], {type: "application/json"});
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

const downloadCSV = () => {
    saveCSV(toCSV(), `${playlist.meta.name}.csv`);
};

const downloadJSON = () => {
    saveJSON(toJSON(), `${playlist.meta.name}.json`);
}

const toCSV = () => {
    let csv = 'Title; Artist; Album\n';
    for(let track of playlist.tracklist){
        let title = track.track.name;
        let album = track.track.album.name;
        let artistArray = [];
        for(let artist of track.track.artists){
            artistArray.push(artist.name)
        }
        let artist = artistArray.join(', ');
        csv += `${title}; ${artist}; ${album}\n`;
    }
    return csv;
};

const toJSON = () => {
    let object = {
        playlist_name: playlist.meta.name,
        playlist_image: playlist.meta.image,
        songs: []
    }
    for(let track of playlist.tracklist){
        let artistArray = [];
        for(let artist of track.track.artists){
            artistArray.push(artist.name)
        }
        object.songs.push({
            title: track.track.name,
            album: track.track.album.name,
            artists: artistArray
        });
    }
    return JSON.stringify(object);
};

</script>

<style>
.card-body {
    text-align: center
}

.card {
    width: 18rem;
    margin-left: 2rem;
    margin-top: 2rem;
    margin-right: 2rem;
    margin-bottom: 2rem;
}
</style>

<div class="card">
    <img src={playlist.meta.images[0].url} class="card-img-top" alt={playlist.meta.images[0].url}>
    <div class="card-body">
      <h5 class="card-title">{playlist.meta.name}</h5>
      <p class="card-text">{playlist.meta.tracks.total} tracks</p>
      <button type="button" class="btn btn-success" on:click={downloadCSV}><i class="fa fa-arrow-down" aria-hidden="true"></i> CSV</button>
      <button type="button" class="btn btn-success" on:click={downloadJSON}><i class="fa fa-arrow-down" aria-hidden="true"></i> JSON</button>
    </div>
  </div>