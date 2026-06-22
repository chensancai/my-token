import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

onclicks = re.findall(r'onclick="([^"]+)"', content)
print('onclick count:', len(onclicks))

func_calls = set()
for oc in onclicks:
    m = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', oc)
    if m:
        func_calls.add(m.group(1))

print('called funcs:', sorted(func_calls))

script_funcs = set(re.findall(r'function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', content))
print('defined funcs in script:', sorted(script_funcs))

missing = func_calls - script_funcs
print('\nMissing:', missing)

check_list = ['showSimpleOfferingModal','showOfferingModal','openChat','openModal','closeModal','sendWish','sendDialogMessage','sendChat','doPrayer','bathingBuddha','toggleSound','confirmIncense','selectIncense','selectLamp','confirmLamp','startShake','showOrderModal','closeDialog','toggleVoice','makeWish','confirmOffering','simpleOfferingConfirm','goToProfile']
print('\n--- Detailed check ---')
for f in check_list:
    status = 'OK' if f in script_funcs else 'MISSING'
    print(f'  [{status}] {f}')

# Check main.js reference
if 'main.js' in content:
    print('\nWARNING: main.js still referenced')
else:
    print('\nOK: main.js removed')

# Check dialog-modal-mask.show
if '.dialog-modal-mask.show' in content:
    print('OK: .dialog-modal-mask.show defined')
else:
    print('MISSING: .dialog-modal-mask.show')

if '.modal-overlay.show' in content:
    print('OK: .modal-overlay.show defined')
else:
    print('MISSING: .modal-overlay.show')
