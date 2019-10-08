<script>
export let token;
import {onMount} from 'svelte';
import PlaylistCard from './PlaylistCard.svelte';
import Spinner from './Spinner.svelte';
$: playlists = loadPlaylists(token);

	const loadPlaylists = async (token) => {
		let response = await fetch(`/playlists/${token}`, {
			method: 'POST',
			body: {
				token: token
			}
		});
		let array = response.json();
		if(response.ok){
			return array;
		}
		else{
			throw new Error(res.text());
		}
	};

</script>

<style>
.center{
    position: absolute;
    left: 1rem;
	text-align: center;
  }

</style>

<!-- <button class='btn btn-primary' on:click = {handleClick}>Press me</button> -->

{#await playlists}
<Spinner />
{:then array}
<div class="card-columns center">
{#each array as element}
<PlaylistCard playlist={element} />
{/each}
</div>
{:catch error}
<p class="center">{error}</p>
{/await}