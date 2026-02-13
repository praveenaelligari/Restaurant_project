import re

# Read the file
with open(r'd:\html files\restaraunt project\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all restaurant card labels with divs
content = re.sub(
    r'<label for="(menu-\d+)" class="res-card">',
    r'<div class="res-card" data-menu="\1">',
    content
)

# Close the divs properly - replace closing labels that are for restaurant cards
# We need to be careful - only replace </label> that are closing restaurant cards
lines = content.split('\n')
new_lines = []
in_res_card = False

for i, line in enumerate(lines):
    if 'class="res-card"' in line and '<div' in line:
        in_res_card = True
        new_lines.append(line)
    elif '</label>' in line and in_res_card and '<!-- Restaurant' not in lines[i-1]:
        # This is likely a restaurant card closing
        new_lines.append(line.replace('</label>', '</div>'))
        in_res_card = False
    else:
        new_lines.append(line)

content = '\n'.join(new_lines)

# Add onerror to all restaurant images
content = re.sub(
    r'(<div class="res-img"><img src="[^"]+"\s+alt="[^"]+")>',
    r'\1 onerror="this.src=\'https://via.placeholder.com/400x250/ff5200/ffffff?text=Restaurant\'">',
    content
)

# Add onerror to all menu item images  
content = re.sub(
    r'(<img src="[^"]*unsplash[^"]*" class="item-img" alt="[^"]+")>',
    r'\1 onerror="this.src=\'https://via.placeholder.com/140x120/60b246/ffffff?text=Food\'">',
    content
)

# Write back
with open(r'd:\html files\restaraunt project\index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed all restaurant cards and added image error handling!")
