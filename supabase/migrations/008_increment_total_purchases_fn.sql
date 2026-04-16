-- Função para incrementar total de compras de um contato (chamada pelo aiPipeline)
CREATE OR REPLACE FUNCTION increment_total_purchases(contact_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE contacts
  SET total_purchases = COALESCE(total_purchases, 0) + 1,
      updated_at = now()
  WHERE id = contact_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
