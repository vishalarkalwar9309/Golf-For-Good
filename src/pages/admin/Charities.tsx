import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, Search, Plus, 
  Edit3, Trash2, 
  Globe, Award,
  CheckCircle2, X,
  Save, Loader2, Image as ImageIcon,
  Power
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn, formatCurrency } from '../../lib/utils';
import { generateSlug } from '../../lib/slugs';
import { usePageTitle } from '../../hooks/usePageTitle';
import EmptyState from '../../components/ui/EmptyState';
import { AbstractGraphic } from '../../components/ui/AbstractGraphic';

interface CharityEntry {
  id: string;
  name: string;
  slug?: string;
  description: string;
  logo_url: string;
  website_url: string;
  category: string;
  total_raised: number;
  featured?: boolean;
  is_active?: boolean;
  is_featured: boolean;
}

const AdminCharities: React.FC = () => {
  usePageTitle('Charity Management | Admin');
  const [charities, setCharities] = useState<CharityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCharity, setEditingCharity] = useState<CharityEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Healthcare',
    logo_url: '',
    website_url: '',
    is_active: true,
    is_featured: false
  });

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('total_raised', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((c: any) => ({
        ...c,
        is_featured: Boolean(c.featured ?? c.is_featured),
        is_active: c.is_active !== undefined ? Boolean(c.is_active) : true,
      }));
      setCharities(normalized);
    } catch (error) {
      console.error('Error fetching charities:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (charity: CharityEntry) => {
    setEditingCharity(charity);
    setFormData({
      name: charity.name,
      description: charity.description,
      category: charity.category,
      logo_url: charity.logo_url,
      website_url: charity.website_url,
      is_active: charity.is_active ?? true,
      is_featured: charity.is_featured
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingCharity(null);
    setFormData({
      name: '',
      description: '',
      category: 'Healthcare',
      logo_url: '',
      website_url: '',
      is_active: true,
      is_featured: false
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        logo_url: formData.logo_url.trim(),
        website_url: formData.website_url.trim(),
        featured: Boolean(formData.is_featured),
      };

      if (editingCharity) {
        const { error } = await supabase
          .from('charities')
          .update(payload)
          .eq('id', editingCharity.id);
        if (error) throw error;
      } else {
        payload.slug = generateSlug(formData.name || 'charity');
        const { error } = await supabase
          .from('charities')
          .insert([payload]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      await fetchCharities();
    } catch (error) {
      console.error('Error saving charity:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean, field: 'is_active' | 'is_featured') => {
    try {
      const dbField = field === 'is_featured' ? 'featured' : field;
      const { error } = await supabase
        .from('charities')
        .update({ [dbField]: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      await fetchCharities();
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('charities')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      await fetchCharities();
    } catch (error) {
      console.error('Error deleting charity:', error);
      alert('Cannot delete charity if active subscriptions or donations reference it.');
    }
  };

  const filteredCharities = charities.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-background pb-20">
      <AbstractGraphic variant="ambient-glow" className="opacity-30" />

      <div className="max-w-7xl mx-auto px-6 py-10 relative z-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
              <Heart className="w-4 h-4" />
              <span>Partner Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-foreground">
              Charity Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1 max-w-xl">
              Add new verified charities, edit existing partner profiles, toggle homepage features, and audit total donations.
            </p>
          </div>

          <button 
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity shadow-md shadow-primary/10 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add New Charity
          </button>
        </div>

        {/* Search & Directory Card */}
        <div className="bg-surface-container border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/10">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search charities by name or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border border-white/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase font-bold text-muted-foreground bg-surface-container-high/50 tracking-wider">
                  <th className="px-6 py-4">Charity Organization</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-center">Featured Status</th>
                  <th className="px-6 py-4 text-right">Total Raised</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-6">
                        <div className="h-8 bg-white/5 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : filteredCharities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <EmptyState 
                        icon={Heart}
                        title="No Charities Found"
                        description="No charity organizations match your search filter."
                        className="border-none bg-transparent"
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCharities.map((charity) => (
                    <tr key={charity.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-surface-container-high rounded-xl border border-white/10 p-1.5 flex items-center justify-center shrink-0 overflow-hidden font-display font-bold text-primary">
                            {charity.logo_url ? (
                              <img src={charity.logo_url} alt="" className="w-full h-full object-contain" />
                            ) : (
                              charity.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <p className="font-display font-bold text-sm text-foreground">
                              {charity.name}
                            </p>
                            {charity.website_url && (
                              <span className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                                <Globe className="w-3 h-3" />
                                {charity.website_url.replace(/^https?:\/\//, '')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-high border border-white/10 text-muted-foreground font-medium">
                          {charity.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleStatus(charity.id, charity.is_featured, 'is_featured')}
                          title={charity.is_featured ? "Remove from Featured" : "Mark as Featured"}
                          className={cn(
                            "w-8 h-8 rounded-lg inline-flex items-center justify-center border transition-colors",
                            charity.is_featured 
                              ? "bg-secondary/20 border-secondary/40 text-secondary" 
                              : "bg-surface-container-high border-white/10 text-muted-foreground opacity-40 hover:opacity-100"
                          )}
                        >
                          <Award className="w-4 h-4" />
                        </button>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <span className="font-display font-bold text-base text-primary">
                          {formatCurrency(charity.total_raised)}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEditModal(charity)}
                            className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-white/10 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(charity.id, charity.name)}
                            className="p-1.5 rounded-lg bg-surface-container-high border border-white/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Charity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-surface-container border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <h3 className="font-display font-bold text-xl text-foreground">
                  {editingCharity ? 'Edit Charity Partner' : 'Add Charity Partner'}
                </h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Organization Name
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="e.g. Beyond Blue"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Category
                    </label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
                    >
                      <option>Healthcare</option>
                      <option>Mental Health</option>
                      <option>Environment</option>
                      <option>Education</option>
                      <option>Community Support</option>
                      <option>Youth & Sport</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Mission & Description
                  </label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Describe their impact and how donations will help..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface-container-high border border-white/10 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Logo URL
                    </label>
                    <input 
                      required
                      type="text" 
                      placeholder="https://..."
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Official Website
                    </label>
                    <input 
                      required
                      type="url" 
                      placeholder="https://..."
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="w-full bg-surface-container-high border border-white/10 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded accent-primary w-4 h-4"
                    />
                    <span>Feature on Homepage</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-surface-container-high text-muted-foreground text-xs font-semibold hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-xs hover:opacity-90 transition-opacity shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{editingCharity ? 'Update Charity' : 'Save Charity'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCharities;
