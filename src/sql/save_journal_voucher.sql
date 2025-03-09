CREATE OR REPLACE FUNCTION save_journal_voucher(
  p_voucher_no TEXT,
  p_project_id BIGINT,
  p_fiscal_id BIGINT,
  p_transaction_date DATE,
  p_remarks TEXT,
  p_details JSONB
) RETURNS VOID AS $$
DECLARE
  v_detail JSONB;
BEGIN
  -- Insert master record
  INSERT INTO "JV" (
    "VOUCHER_NO",
    "PROJECT_ID",
    "FISCAL_ID",
    "TRANSACTION_DATE",
    "ENTERED_BY",
    "REMARKS"
  ) VALUES (
    p_voucher_no,
    p_project_id,
    p_fiscal_id,
    p_transaction_date,
    auth.uid(),
    p_remarks
  );

  -- Insert detail records
  FOR v_detail IN SELECT * FROM jsonb_array_elements(p_details)
  LOOP
    INSERT INTO "JVD" (
      "VOURCHER_NO",
      "AC_CODE",
      "DR",
      "CR",
      "NOTES"
    ) VALUES (
      p_voucher_no,
      (v_detail->>'ac_code')::TEXT,
      (v_detail->>'dr')::NUMERIC,
      (v_detail->>'cr')::NUMERIC,
      v_detail->>'notes'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 