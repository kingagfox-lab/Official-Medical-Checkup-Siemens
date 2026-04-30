import os
import re

files = ['Index.html', 'packages.html', 'booking.html', 'health-tools.html', 'portal.html', 'locations.html']

# 1. Hide Request Consultation button on mobile
# 2. Ensure mobile menu button is present and visible

for f in files:
    if not os.path.exists(f): continue
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Hide the Request Consultation button on mobile
    # It might have different classes in different files
    # We'll look for buttons/links containing "Request Consultation"
    content = re.sub(r'(<a\s+[^>]*?class=")([^"]*?)(?<!hidden )md:block([^"]*?)([^"]*?>\s*Request Consultation)', r'\1hidden md:block\3\4', content)
    # If it doesn't have md:block yet:
    content = re.sub(r'(<a\s+[^>]*?class=")([^"]*?)(?<!hidden )(?!md:block)([^"]*?>\s*Request Consultation)', r'\1hidden md:block \2\3', content)

    # In some files it might be in a div with hidden md:flex
    # We already changed those to flex items-center gap-2 md:gap-4
    
    # Ensure mobile-menu-btn is inside the flex container on the right
    # And has the SVG icon for consistency if it's the span version
    svg_icon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>'
    
    # Find the right-side flex container
    # It usually starts with <div class="flex items-center gap-2 md:gap-4"> or similar
    
    # If mobile-menu-btn is outside, move it inside
    if 'id="mobile-menu-btn"' in content:
        # Extract the button
        btn_match = re.search(r'<button id="mobile-menu-btn".*?</button>', content, re.DOTALL)
        if btn_match:
            btn_code = btn_match.group(0)
            # Remove from original position
            content = content.replace(btn_code, '')
            # Clean up whitespace
            content = re.sub(r'\n\s*\n', '\n\n', content)
            # Re-insert inside the action div (before the closing </div>)
            # Find the action div that contains theme-toggle
            action_div_pattern = r'(<div class="flex items-center gap-2 md:gap-4">.*?)(</div>)'
            content = re.sub(action_div_pattern, r'\1    ' + btn_code + r'\n            \2', content, flags=re.DOTALL)

    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)

print("Fixed mobile navigation visibility.")
