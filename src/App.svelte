<script>
	import LoginCard from './LoginCard.svelte';
	import PlaylistDeck from './PlaylistDeck.svelte';
	
	$: cookies = document.cookie.split(';');
	$: token = cookies[0].split('=')[1];
	

</script>

{#if !token}
<LoginCard/>
{:else}
<PlaylistDeck token={token}/>
{/if}

