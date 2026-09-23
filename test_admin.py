import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless')
options.add_argument('--disable-gpu')
options.add_argument('--no-sandbox')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
driver.get("http://localhost:8000/admin.html")
time.sleep(2)

logs = driver.get_log('browser')
for log in logs:
    print(log)

print("HTML source preview:")
print(driver.page_source[:500])
driver.quit()
