<script>
let loginPage = '/login';
</script>

<style>
.center{
    transform: translate(-50%, -50%);
    position: absolute;
    top: 50%;
    left: 50%;
    padding: 20px;
    overflow: auto;
	text-align: center;
  }
</style>

<div class="card center bg-secondary">
  <div class="card-header">
    Get ready to transfer your Spotify playlists to CSV files
  </div>
  <div class="card-body">
    <h5 class="card-title">First login</h5>
    <p class="card-text">Login with your Spotify Account</p>
    <a href={loginPage} class="btn btn-primary">Login</a>
  </div>
</div>