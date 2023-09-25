
# Requires:
# 	brew install tag (https://github.com/jdberry/tag)
#	brew install transmission (https://transmissionbt.com/)

tvFolder="/Users/$(whoami)/Library/Mobile Documents/com~apple~CloudDocs/Media/TV Shows"
moviesFolder="/Users/$(whoami)/Library/Mobile Documents/com~apple~CloudDocs/Media/Movies"

tvAppRootUrl="https://_medialife_webapp_homepage"
unwatchedTag="Blue"
torrentLabel="Purple"


# Build data to send to server

postData="START_GROUP:SETTINGS"$'\n'
postData+="UnwatchedTag: ${unwatchedTag}"$'\n'
postData+=$'\n'


postData+="START_GROUP:FILES:TV"$'\n'

spotlightFiles=$(/usr/local/bin/tag --find '*' "${tvFolder}" -t)
spotlightFiles+=$(/usr/local/bin/tag --find '' "${tvFolder}" -t)

findFiles=$(find "${tvFolder}" -type f)

if [ "$(wc -l <<< "$spotlightFiles")" -gt "$(wc -l <<< "$findFiles")" ]; then

	postData+="${spotlightFiles}"
	
else
	
	#Problem with spotlight (prob indexing), use this slower find method
	export IFS=$'\n'
	for line in $findFiles; do

		tags=$(/usr/local/bin/tag -l -N "${line}")
		postData+="${line}"$'\t'"${tags}"$'\n'
		
	done

fi
postData+=$'\n'


postData+="START_GROUP:FILES:MOVIES"$'\n'

spotlightFiles=$(/usr/local/bin/tag --find '*' "${moviesFolder}" -t)
spotlightFiles+=$(/usr/local/bin/tag --find '' "${moviesFolder}" -t)

findFiles=$(find "${moviesFolder}" -type f)

if [ "$(wc -l <<< "$spotlightFiles")" -gt "$(wc -l <<< "$findFiles")" ]; then

	postData+="${spotlightFiles}"
	
else
	
	#Problem with spotlight (prob indexing), use this slower find method
	export IFS=$'\n'
	for line in $findFiles; do

		tags=$(/usr/local/bin/tag -l -N "${line}")
		postData+="${line}"$'\t'"${tags}"$'\n'
		
	done

fi
postData+=$'\n'


postData+="START_GROUP:TORRENTS"$'\n'
while read -ra line; do
	
	trimmed="${line#"${line%%[![:space:]]*}"}"
	id="${trimmed%% *}"
	
	if [[ ! -z $(/usr/local/bin/transmission-remote -t ${id} -i) ]]; then
	
		info=$(/usr/local/bin/transmission-remote -t "${id}" -i)
		label=$(echo "$info" | sed -n 's/.*Labels: \(.*\).*/\1/p')

		if [[ "$label" == "$torrentLabel" ]]; then
		
			torrentLine=$(echo "$info" | sed -n 's/.*Hash: \(.*\).*/\1/p')
			torrentLine+="	"
			torrentLine+=$(echo "$info" | sed -n 's/.*Name: \(.*\).*/\1/p')
			torrentLine+="	"
			torrentLine+=$(echo "$info" | sed -n 's/.*Percent Done: \(.*\)%.*/\1/p')
			torrentLine+="	"
			
			IFS=''
			namePos=0
			while read fileLine; do

				if [[ "${namePos}" > 0 ]]; then
					torrentLine+="FILE:${fileLine:namePos}"
				fi
	
				x="${fileLine%%Name*}"
				if [[ ! "$x" = "${fileLine}" ]]; then
					namePos=$(echo "${#x}")
				fi
	
			done < <(/usr/local/bin/transmission-remote -t "${id}" -f)
			
			postData+="${torrentLine}"$'\n'
		fi
	fi
done < <(/usr/local/bin/transmission-remote -l)

# Send to server

serverData=$(curl -X POST --insecure --data "${postData}" "${tvAppRootUrl}/Update/client")


# Process lines

activeGroup=""
activeSubGroup=""
counter=0;
export IFS=$'\n'
for line in $serverData; do
	if [[ "${line}" == "START_GROUP:"* ]]; then
				
		if [[ ! -z "${activeGroup}" ]]; then
			echo "${counter} x ${activeGroup} ${activeSubGroup}"
			counter=0
		fi
		activeGroup="${line:12}"
		activeSubGroup=""
		if [[ "${activeGroup}" == "SAVE_&_DELETE_TORRENTS:"* ]]; then
			activeSubGroup="${activeGroup:23}"
			activeGroup="SAVE_&_DELETE_TORRENTS"
		fi
		
	else
	
		if [[ "${activeGroup}" == "DELETE_TORRENTS" ]]; then

			/usr/local/bin/transmission-remote -t "${line}" -rad > /dev/null
			counter=$((counter+1));

		fi
		
		if [[ "${activeGroup}" == "SAVE_&_DELETE_TORRENTS" ]]; then
		
			root=""
			if [[ "${activeSubGroup}" == "TV" ]]; then root="${tvFolder}"; fi
			if [[ "${activeSubGroup}" == "MOVIES" ]]; then root="${moviesFolder}"; fi
			
			if [[ ! -z "${root}" ]]; then
						
				hash="${line%%$'\t'*}"
				line="${line:${#hash}+1}"
				source="${line%%$'\t'*}"
				line="${line:${#source}+1}"
				destFolder="${root}${line%%$'\t'*}"
				destFile="${line#*$'\t'}"
			
				info=$(/usr/local/bin/transmission-remote -t "${hash}" -i)
				if [[ ! -z ${info} ]]; then
				
					location=$(echo "$info" | sed -n 's/.*Location: \(.*\).*/\1/p')
					if [[ -z ${source} ]]; then
						name=$(echo "$info" | sed -n 's/.*Name: \(.*\).*/\1/p')
						source="${location}/${name}"
						destFolder="${destFolder}/${destFile}/"
						destFile=""
					else
						source="${location}/${source}"
					fi
				
					mkdir -p "${destFolder}" && cp -R "${source}" "${destFolder}/${destFile}"
					/usr/local/bin/tag -a "Orange,${unwatchedTag}" "${destFolder}/${destFile}";
					/usr/local/bin/transmission-remote -t "${hash}" -rad > /dev/null
			
					counter=$((counter+1));	
				fi
			fi
			
		fi
		
		if [[ "${activeGroup}" == "ADD_TORRENTS" ]]; then

			hash="${line%%$'\t'*}"
			name="${line#*$'\t'}"
 			/usr/local/bin/transmission-remote -a "magnet:?xt=urn:btih:${hash}&dn=${name}" > /dev/null
			/usr/local/bin/transmission-remote -t "${hash}" -L "$torrentLabel" > /dev/null
			counter=$((counter+1));
			
		fi
		
		if [[ "${activeGroup}" == "DELETE_FILES" ]]; then
		
			if [[ -f "${line}" ]]; then
 				rm "${line}"
				counter=$((counter+1));
			fi
			
		fi
		
		if [[ "${activeGroup}" == "RETAG_FILES" ]]; then
			
			path="${line%$'\t'*}"
			tags="${line##*$'\t'}"
			
			echo "${path}"
			echo "${tags}"
			
			if [[ -f "${path}" ]]; then
				echo "go..."
				/usr/local/bin/tag -s "${tags}" "${path}"
				counter=$((counter+1));
			fi

		fi
		
		if [[ "${activeGroup}" == "DOWNLOAD_FILES_FROM_CLOUD" ]]; then
			
			if [[ -f "${line}" ]]; then
			
				path=$(dirname -- "$line")
				filename=$(basename -- "$line")
				filename="${filename%.*}"
				
				brctl download "${path}/${filename:1}"
				
				counter=$((counter+1));
			fi

		fi
	
	fi
done

echo "${counter} x ${activeGroup}"

find "${tvFolder}" -type d  -empty -delete
find "${moviesFolder}" -type d  -empty -delete

echo "Done"