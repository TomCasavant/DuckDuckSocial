// Extract the search term from DuckDuckGo's URL
const urlParams = new URLSearchParams(window.location.search);
const searchTerm = urlParams.get('q');
console.log("Search Term: ", searchTerm);
if (searchTerm) {
    // Request the settings from the background script
    browser.runtime.sendMessage({ action: 'getSettings' })
        .then(settings => {
            console.log("Settings: ", settings);
            const mastodonDomain = settings.domain;
            const numPosts = settings.numPosts;
            const dropWords = settings.dropWords;
            const dateType = settings.dateType;

            console.log("All settings: ", settings);
            console.log("Mastodon Domain: ", mastodonDomain);
            console.log("Number of Posts: ", numPosts);
            console.log("Drop Words: ", dropWords);
            console.log("Date Type: ", dateType);

            // Parse dropWords as a list, then drop words from the search term that match any of the words in the list
            const dropWordsList = dropWords.split(',').map(word => word.trim());

            // Using Regex instead of a simple split in case someone wants to include the space or have phrases dropped
            const replacedSearchTerm = searchTerm.replace(new RegExp(dropWordsList.join('|'), 'gi'), '');
            console.log("Replaced Search Term: ", replacedSearchTerm);
            browser.runtime.sendMessage({ action: 'searchMastodon', searchTerm: replacedSearchTerm })
                .then(response => {
					console.log(response);
                    if (response.success) {
						console.log(response);
                        const results = response.results;

                        var div = document.createElement('div');
                        div.className = 'duckducksocial-results'; 

                        results.slice(0, numPosts).forEach(function(post) {
                            var postDiv = document.createElement('div');
                            postDiv.className = 'duckducksocial-post'; 

                            var usernameWrapper = document.createElement('div');
                            usernameWrapper.className = 'duckducksocial-username-wrapper';

                            var username = document.createElement('p');
                            username.textContent = `@${post.account.acct}`;
                            username.className = 'duckducksocial-username';
                            // Add <hr> separator between username and content
                            var hr = document.createElement('hr');
                            hr.className = 'duckducksocial-hr';
                            usernameWrapper.appendChild(username);
                            usernameWrapper.appendChild(hr);

							var sanitizedContent = DOMPurify.sanitize(post.content);
                            var content = document.createElement('p');
							content.innerHTML = post.content;
							content.className = 'duckducksocial-content';


                            // Datetime
                            var datetime = document.createElement('p');
                            // If the dateType is set to 'relative', use a relative date otherwise use an absolute date
                            if (dateType === 'relative') {
                                // Calculate time since post was created
                                var now = new Date();
                                var created = new Date(post.created_at);
                                var diff = now - created;
                                var seconds = Math.floor(diff / 1000);
                                var minutes = Math.floor(seconds / 60);
                                var hours = Math.floor(minutes / 60);
                                var days = Math.floor(hours / 24);
                                var months = Math.floor(days / 30);
                                var years = Math.floor(months / 12);
                                // Adjust how date is displayed depending on how long ago the post was created
                                if (years > 0) {
                                    datetime.textContent = years + 'y';
                                } else if (days > 0) {
                                    datetime.textContent = days + 'd';
                                } else if (hours > 0) {
                                    datetime.textContent = hours + 'h';
                                } else if (minutes > 0) {
                                    datetime.textContent = minutes + 'm';
                                } else {
                                    datetime.textContent = seconds + 's';
                                }
                            } else {
                                datetime.textContent = new Date(post.created_at).toLocaleString();
                            }
                            datetime.className = 'duckducksocial-datetime';

                            var postHref = document.createElement('a');
                            postHref.href = `https://${mastodonDomain}/@${post.account.acct}/${post.id}`;
                            postHref.appendChild(postDiv);

                            postDiv.appendChild(usernameWrapper);
                            postDiv.appendChild(content);
							if (post.media_attachments && post.media_attachments.length > 0) {
								var mediaContainer = document.createElement('div');
								mediaContainer.className = 'duckducksocial-media-container';

								post.media_attachments.forEach(function (media) {
									var mediaElement;

									if (media.type === 'image') {
										mediaElement = document.createElement('img');
										mediaElement.src = media.url;
										mediaElement.alt = media.description || 'Photo from mastodon search results. No alt text available';
										mediaElement.className = 'duckducksocial-media-image';
									} else if (media.type === 'video' || media.type === 'gifv') {
										mediaElement = document.createElement('video');
										mediaElement.src = media.url;
										mediaElement.controls = true;
										mediaElement.className = 'duckducksocial-media-video';
									}

									if (mediaElement) {
										mediaContainer.appendChild(mediaElement);
									}
								});

								postDiv.appendChild(mediaContainer);
							}
                            postDiv.appendChild(datetime);

                            div.appendChild(postHref);
                        });

                        // Insert the container div into the document
                        var layout = document.getElementById('react-layout');
                        layout.insertBefore(div, layout.firstChild);
                    } else {
                        console.error('Failed to retrieve search results:', response.error);
                    }
                });
        })
        .catch(error => {
            console.error('Failed to retrieve settings:', error);
        });
}

