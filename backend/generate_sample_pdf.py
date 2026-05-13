from fpdf import FPDF

class LoanDocument(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'HOME LOAN AGREEMENT', 0, 1, 'C')
        self.ln(10)

def create_pdf():
    pdf = LoanDocument()
    pdf.add_page()
    pdf.set_font('Arial', '', 12)
    
    clauses = [
        "1. Loan Terms and Repayment\n"
        "The Borrower agrees to repay the principal amount along with the agreed fixed interest rate in monthly installments over the period of 30 years. All payments shall be made on the 1st of each month. This constitutes the standard repayment schedule.",
        
        "2. Interest Rate Adjustments\n"
        "The Lender reserves the right to unilaterally adjust the interest rate at any time based on internal market assessments. The Borrower must accept the new rate within 7 days, or the loan becomes immediately due and payable.",
        
        "3. Default and Acceleration\n"
        "In the event of default on a single payment, or if the Lender deems themselves insecure, the Lender reserves the right to demand immediate full repayment of the entire outstanding loan balance. The Lender may seize the property without prior notice or judicial review.",
        
        "4. Waiver of Rights\n"
        "The Borrower hereby waives any right to legal recourse, mediation, or arbitration in disputes concerning the calculation of interest, fees, or penalties. The Borrower agrees that the Lender's calculations shall be strictly final and unquestionable.",
        
        "5. Prepayment Penalty\n"
        "If the Borrower pays off the loan balance before the maturity date, a prepayment penalty of 10% of the original loan amount will be strictly enforced without exception.",
        
        "6. Maintenance and Inspections\n"
        "The Borrower is required to maintain the property in good repair. The Lender may conduct unannounced inspections of the interior and exterior of the property at any time during the loan term without prior consent."
    ]
    
    for clause in clauses:
        pdf.multi_cell(0, 8, clause)
        pdf.ln(6)
        
    pdf.output('sample_home_loan.pdf')
    print("Successfully generated sample_home_loan.pdf")

if __name__ == '__main__':
    create_pdf()
