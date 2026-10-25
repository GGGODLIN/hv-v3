Known Bugs - EHWiki

- # Known Bugs

			
				From EHWiki
				(Redirected from Bugs)
				
				Jump to navigationJump to search
				
				This article is for any known errors in E-Hentai that are believed to be non-intentional.

## Contents

1 E-Hentai

- 2 Wiki

- 3 Forums

- 4 Galleries

- 5 Bounty System

- 6 Hentai@Home

- 7 EHTracker

- 8 HentaiVerse

- 9 See also

## E-Hentai

- Aesthetic - Underscores (such as those in usernames) may appear as spaces in the GP Exchange/Hath Exchange. Varies based on browser and font settings. (Screenshot)

## Wiki

- Bug - Existing articles may fail to properly redirect or display as red links if not yet cached. In such cases, red links still lead to the article and the redirect works every second visit.
Workaround for uncached red links - Make a minor edit and remove the linefeed at the end of the article. This does not count as an edit but forcefully refreshes the article.

- This bug usually triggers for circular references involving new articles and will also fix itself after recaching happens.

## Forums

- Aesthetic - Field usage warnings do not take certain characters into account when attempting to throw an alert with current character usage with priority over the board error message.
Workaround - If the native IPB system throws in a "field too long" error, keep shortening the field - that means it still is over the allowed limit.

- Aesthetic - Forum attachments will show as attached to a "Personal Message" if the attachment was added to a thread without applying changes (as the board is confused about where they are).
Such attachments can be linked to (by embedding them and linking to the temporary file) but will self-destruct after a short period. This behavior is working as intended.

## Galleries

- Aesthetic - Empty unpublished galleries may sometimes be listed under unpublished instead of empty. This usually happens if there was a problem during the uploading phase or if it was cancelled by the user.
Workaround - Upload any picture in the gallery manager, remove it, apply order and save changes. The unpublished gallery should now be correctly categorized as empty.

- Aesthetic - Two links appear for new galleries, Create Gallery and Create New Gallery (with the latter being bolded). Both are used for the same action and are redundant.
Workaround - CSS as usual or remove it from the DOM on your side if you want more than just hidden elements.

- Bug - New comments may take some time to appear. This is due to URL changes in the gallery system; comments will show up once everything has been cached.

- Bug? - Updating new files/reordering locks all interactions with the gallery besides the order type choices. While this is the intended behavior, any description changes made in between will also be discarded.
Workaround - Always save the description first if it was changed.

- Bug? - Full-width whitespaces as well as other invisible characters are accepted, allowing for empty titles.

- Bug? - Lo-Fi galleries do not use namespaces.

- Bug - Tag previews sometimes fail to show up in results. Both tag flags and searchable tags will be gone in Compact and Extended display modes.
Workaround - Refreshing the search query page may fix this but may also cause another gallery preview to show this behavior.

- Bug - Pagecount filtering arguments are passed through the query URL even if not searching by pagecount. Mostly aesthetic as f_sp is not invoked and this adds empty f_spf and f_spt arguments to the search query as a result.

- Bug? - The hidden comment argument is not kept between pages if the user chooses to display all comments regardless of score (and as such hides them again). This is possibly intentional.

## Bounty System

- Bug - The "Bounty Status" argument will sometimes get passed to the query twice. If this happens, the last one will be used. Example[1]

## Hentai@Home

- Aesthetic - Client settings may report minimum requirements as 100KB/s burst speed, 100MB hourly limit and 2GB cache after a shutdown.
The actual requirements still are 200KB/s, 300MB and 10GB (or static range count*175MB, whichever is higher) respectively. Anything below this will return an error if set and fail to apply.

- Bug - Clients do not retain the year they were last seen and will report "Today, hh:mm" one year after being last seen (they will not show "Yesterday, hh:mm" on the next day but "M dd, hh:mm" again).
Idle clients do not get pruned exactly one year after being last seen on the network, which may be related to an internal change in the pruning process. They will still expire after ~400 days of being idle.

## EHTracker

- Bug? - Creating a torrent will always announce the root (oldest) gallery ID in a gallery chain. Clicking the torrent in the torrent list will link to the root gallery instead of the most recent update.
Probably working as intended as using any node will still redirect to the root upon creation. Additional trackers with each gallery update can be used clientside but this has no effect on the swarm.

## HentaiVerse

## See also

- Proofreading

Retrieved from "https://ehwiki.org/index.php?title=Known_Bugs&oldid=53636"
				Categories: 
- Administrative
- Sporadic Updates
				
				
			
		
		
	
	
		
## Navigation menu

		
			
### Page actions

			
				
				
- Page
- Discussion
- Read
- View source
- History
				
				
			
		
		

	
### Page actions

	
		
- Page
- Discussion
- More
- Tools
		
	

		
			
### Personal tools

			
				
				
- Create account
- Log in
				
			
		
		
			
		
		
		

	
### Navigation

	
		
- Main Page
- Recent changes
- Random page
- Help
		
	

		
			
### Search

			
				 
			
		
		

	
### external links

	
		
- E-Hentai.org
- E-Hentai Forums
- HentaiVerse
		
	

	
### Tools

	
		
- What links here
- Related changes
- Special pages
- Printable version
- Permanent link
- Page information
		
	

		
		
		
		
		
	
	
	
	
		
			
		
		
			
		
		
			
- This page was last edited on 19 February 2021, at 13:59.
- Content is available under GNU Free Documentation License 1.2+ unless otherwise noted.
			
- Privacy policy
- About EHWiki
- Disclaimers