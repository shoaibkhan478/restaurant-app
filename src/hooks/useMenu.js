import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMenu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMenu() {
      setLoading(true);
      
      const { data: cats } = await supabase
        .from('menu_categories')
        .select('*, image_url')
        .order('display_order');

      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('*, image_url')
        .eq('is_available', true);

      setCategories(cats || []);
      setItems(menuItems || []);
      setLoading(false);
    }

    fetchMenu();
  }, []);

  return { categories, items, loading };
}

