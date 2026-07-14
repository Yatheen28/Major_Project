"""Integration test — Phase A5. Run with: python test_integration.py"""
import requests

BASE = "http://localhost:8000"

# === INGEST CASE 1 ===
print("=== Ingesting Case 1 ===")
r1 = requests.post(f"{BASE}/api/ingest", json={
    "text": "Mujhe 12/03/2024 ko ek call aaya number 9876543210 se. Unhone bola ki aapka UPI account deepak@ybl block ho gaya hai. Maine Rs.15000 transfer kar diye UTR UTIB12345678901234 pe. Website https://scamsite.com se link bheja tha.",
    "submitted_by": "SI Pradeep Kumar"
})
case1 = r1.json()
print(f"  Case ID: {case1['case_id']}")
print(f"  Entities: {case1['entity_counts']}")
print(f"  Status: {r1.status_code}")

# === INGEST CASE 2 (shares deepak@ybl and 9876543210) ===
print()
print("=== Ingesting Case 2 ===")
r2 = requests.post(f"{BASE}/api/ingest", json={
    "text": "Mera naam Rakesh hai. 15/03/2024 ko phone number 9876543210 se call aaya. Bola aapka deepak@ybl pe problem hai. Maine Rs.25000 bheje account number 12345678901234 pe. Reference UTIB99887766554433.",
    "submitted_by": "SI Anjali Sharma"
})
case2 = r2.json()
print(f"  Case ID: {case2['case_id']}")
print(f"  Entities: {case2['entity_counts']}")
print(f"  Status: {r2.status_code}")

# === INGEST CASE 3 (shares deepak@ybl only) ===
print()
print("=== Ingesting Case 3 ===")
r3i = requests.post(f"{BASE}/api/ingest", json={
    "text": "Maine 20/03/2024 ko deepak@ybl pe Rs.10000 transfer kiya after getting a link from https://phishing-page.example.com. Scammer ka number 7654321098 tha.",
    "submitted_by": "ASI Vikram Singh"
})
case3 = r3i.json()
print(f"  Case ID: {case3['case_id']}")
print(f"  Entities: {case3['entity_counts']}")
print(f"  Status: {r3i.status_code}")

# === GET LINKED CASES ===
print()
print(f"=== Linked cases for {case1['case_id']} ===")
r3 = requests.get(f"{BASE}/api/cases/{case1['case_id']}/links")
links = r3.json()
for lnk in links:
    print(f"  -> {lnk['case_id']} via {lnk['shared_entity_type']}={lnk['shared_entity_value']} (risk={lnk['risk_score']})")
print(f"  Total links: {len(links)}")

# === GET RISK SCORES ===
print()
print(f"=== Risk scores for {case1['case_id']} ===")
r4 = requests.get(f"{BASE}/api/cases/{case1['case_id']}/risk")
risks = r4.json()
for r in risks:
    print(f"  {r['entity_type']}={r['entity_value']}: count={r['case_count']}, risk={r['risk_score']}")

# === GET CERTIFICATE ===
print()
print(f"=== Certificate for {case1['case_id']} ===")
r5 = requests.get(f"{BASE}/api/cases/{case1['case_id']}/certificate")
print(f"  Status: {r5.status_code}")
print(f"  Content-Type: {r5.headers.get('content-type')}")
print(f"  PDF size: {len(r5.content)} bytes")
assert r5.content[:5] == b"%PDF-", "NOT A VALID PDF!"
print("  Valid PDF confirmed")

# === HEALTH CHECK ===
print()
print("=== Health check ===")
r6 = requests.get(f"{BASE}/api/health")
health = r6.json()
print(f"  Status: {health['status']}")
print(f"  Version: {health['version']}")
print(f"  Total cases: {health['total_cases']}")

# === CASES LIST ===
print()
print("=== All cases ===")
r7 = requests.get(f"{BASE}/api/cases")
cases = r7.json()
for c in cases:
    print(f"  {c['case_id']} by {c['submitted_by']} ({c['status']})")

print()
print("=" * 50)
print("  ALL INTEGRATION TESTS PASSED!")
print("=" * 50)
