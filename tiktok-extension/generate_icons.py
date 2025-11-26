"""
Simple script to generate placeholder icons for the Chrome extension
Run this to create the required icon files quickly
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, output_path):
    """Create a simple lightning bolt emoji icon"""
    # Create a gradient background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw gradient background (purple gradient)
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b))
    
    # Try to add emoji or text
    try:
        # Try to use a nice font if available
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype("seguiemj.ttf", font_size)  # Windows emoji font
        except:
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
        
        text = "⚡"
        
        # Get text size and center it
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        position = ((size - text_width) // 2, (size - text_height) // 2 - size//10)
        
        # Draw white text
        draw.text(position, text, font=font, fill='white')
    except Exception as e:
        print(f"Could not add emoji for size {size}: {e}")
        # Fallback: draw a simple lightning bolt shape
        points = [
            (size*0.5, size*0.2),
            (size*0.4, size*0.5),
            (size*0.6, size*0.5),
            (size*0.5, size*0.8)
        ]
        draw.polygon(points, fill='white')
    
    img.save(output_path, 'PNG')
    print(f"✅ Created {output_path}")

def main():
    """Generate all required icon sizes"""
    # Get the directory where this script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(script_dir, 'icons')
    
    # Create icons directory if it doesn't exist
    os.makedirs(icons_dir, exist_ok=True)
    
    # Create icons in different sizes
    sizes = {
        'icon16.png': 16,
        'icon48.png': 48,
        'icon128.png': 128
    }
    
    print("🎨 Generating Chrome extension icons...")
    print()
    
    for filename, size in sizes.items():
        output_path = os.path.join(icons_dir, filename)
        create_icon(size, output_path)
    
    print()
    print("✨ All icons generated successfully!")
    print(f"📁 Icons saved to: {icons_dir}")
    print()
    print("Next steps:")
    print("1. Load the extension in Chrome (chrome://extensions/)")
    print("2. Configure your target username in settings")
    print("3. Enjoy automatic daily messages! 🔥")

if __name__ == "__main__":
    try:
        main()
    except ImportError:
        print("❌ PIL/Pillow not installed")
        print("Install it with: pip install Pillow")
        print()
        print("Alternative: Create the icons manually")
        print("  - icons/icon16.png (16x16)")
        print("  - icons/icon48.png (48x48)")
        print("  - icons/icon128.png (128x128)")
    except Exception as e:
        print(f"❌ Error: {e}")
