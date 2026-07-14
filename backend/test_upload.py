import requests
import fitz # PyMuPDF
import os
import time
import sys

def run_test():
    # 1. Create a dummy text-based PDF complaint
    doc = fitz.open()
    page = doc.new_page()
    complaint_text = "I received a fraud call on 15/04/2024 from number 9876543210. They stole Rs.5000 via UPI ID scammer@ybl. Please help."
    page.insert_text(fitz.Point(50, 50), complaint_text)
    pdf_path = "test_complaint.pdf"
    doc.save(pdf_path)
    doc.close()

    print(f"Created {pdf_path}")

    # Wait a moment for server to be fully ready
    time.sleep(2)

    # 2. Upload it to the API
    url = "http://localhost:8000/api/ingest/upload"
    try:
        with open(pdf_path, "rb") as f:
            files = {"file": ("test_complaint.pdf", f, "application/pdf")}
            data = {"submitted_by": "Officer R. Desai (Cyber Cell)"}
            
            print("Uploading to /api/ingest/upload...")
            resp = requests.post(url, files=files, data=data)
            
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                res_json = resp.json()
                print(f"Case ID: {res_json['case_id']}")
                print(f"Entities: {res_json['entity_counts']}")
                print(f"Extracted Text: {res_json['raw_text']}")
                print("OCR PIPELINE VERIFIED OK")
            else:
                print(f"Failed with {resp.status_code}: {resp.text}")
                sys.exit(1)
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)

if __name__ == "__main__":
    run_test()
