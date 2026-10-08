import re

with open('src/app/cart/page.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace imports
if 'ShieldCheck' not in c:
    c = re.sub(r'import \{([^}]+)\} from [\'"]lucide-react[\'"]', r'import {\1, ShieldCheck, Truck} from "lucide-react"', c)

# Append trust badges
badges = """
            <div className="mt-6 pt-4 border-t border-brand-linen flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Secure Payments (Razorpay)
              </div>
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                <Truck className="w-4 h-4 text-brand-orange" />
                Dispatch within 24 Hours
              </div>
            </div>
          </div>"""

c = c.replace('</Link>\n          </div>', '</Link>' + badges)

with open('src/app/cart/page.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Cart fixed")
