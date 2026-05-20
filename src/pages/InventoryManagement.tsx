import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, Package, Briefcase, ChevronLeft, ChevronRight, Info } from 'lucide-react';

export function InventoryManagement({ companyId }: { companyId: string }) {
  // --- Core State ---
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Server-Side Pagination State ---
  const [totalItemsCount, setTotalItemsCount] = useState(0); 
  const [totalPages, setTotalPages] = useState(1); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // --- Derived Dashboard Metrics State ---
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalItems: 0,
    lowStock: 0,
    services: 0,
    inventoryValue: 0
  });

  // --- Form State ---
  const [formData, setFormData] = useState({
    id: null as number | null,
    itemType: 'Product', 
    itemName: '', itemCode: '', salePrice: '', purchasePrice: '', 
    taxRate: '0', openingStock: '', unit: 'PCS'
  });

  // --- Data Fetching ---
  const fetchData = async () => {
    const resItems = await window.electronAPI.getItems({
      companyId: Number(companyId),
      page: currentPage,
      limit: itemsPerPage,
      searchTerm: searchTerm
    });
    
    if (resItems.success) {
      setItems(resItems.data || []);
      setTotalItemsCount(resItems.total || 0);
      setTotalPages(resItems.totalPages || 1);
    }

    const resStats = await window.electronAPI.getInventoryStats(Number(companyId));
    if (resStats.success && resStats.stats) {
      setDashboardMetrics(resStats.stats);
    }

    const resUnits = await window.electronAPI.getUnits();
    if (resUnits.success && resUnits.data) setUnits(resUnits.data);
  };

  useEffect(() => { fetchData(); }, [companyId, currentPage, searchTerm]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // --- Handlers ---
  const handleSaveItem = async () => {
    if (!formData.itemName) return alert("Item Name is required!");
    const payload = {
      id: formData.id, companyId: Number(companyId), itemType: formData.itemType,
      itemName: formData.itemName, itemCode: formData.itemCode, salePrice: Number(formData.salePrice),
      purchasePrice: Number(formData.purchasePrice), taxRate: Number(formData.taxRate),
      openingStock: formData.itemType === 'Service' ? 0 : Number(formData.openingStock), unit: formData.unit
    };
    const res = await window.electronAPI.saveItem(payload);
    if (res.success) { closeModal(); fetchData(); } else { alert(res.message); }
  };

  const handleEditClick = (item: any) => {
    setFormData({
      id: item.id, itemType: item.item_type || 'Product', itemName: item.item_name,
      itemCode: item.item_code || '', salePrice: item.sale_price.toString(),
      purchasePrice: item.purchase_price.toString(), taxRate: item.tax_rate.toString(),
      openingStock: item.opening_stock.toString(), unit: item.unit
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const res = await window.electronAPI.deleteItem(id);
      if (res.success) fetchData(); else alert("Failed to delete item.");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ id: null, itemType: 'Product', itemName: '', itemCode: '', salePrice: '', purchasePrice: '', taxRate: '0', openingStock: '', unit: 'PCS' });
  };

  // --- UI Math ---
  const startEntry = (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, totalItemsCount);

  return (
    <div className="min-h-full flex flex-col animate-fade-in duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Items & Services</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">Manage your products, services, and inventory levels <br/> across all warehouse locations.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative w-64 group">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all font-medium" 
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-full shadow-md hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center hover:border-blue-200 transition-colors">
          <p className="text-sm font-semibold text-slate-500 mb-1">Total Items</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-medium text-slate-800">{dashboardMetrics.totalItems.toLocaleString()}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center relative overflow-hidden hover:border-rose-200 transition-colors">
          <p className="text-sm font-semibold text-slate-500 mb-1">Low Stock Alerts</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-medium text-rose-600">{dashboardMetrics.lowStock}</h3>
            <span className="text-xs font-medium text-slate-400">Items &le; 5 units</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center hover:border-emerald-200 transition-colors">
          <p className="text-sm font-semibold text-slate-500 mb-1">Service Contracts</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-medium text-slate-800">{dashboardMetrics.services}</h3>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Active</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center hover:border-amber-200 transition-colors">
          <p className="text-sm font-semibold text-slate-500 mb-1">Inventory Value</p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-medium text-slate-800">₹{(dashboardMetrics.inventoryValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          </div>
        </div>
      </div>

      {/* MAIN DATA TABLE (Expanded Grid) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto min-h-[400px]">
          {/* Increased min-w to accommodate all details without squishing */}
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[11px] font-bold text-slate-500 tracking-widest uppercase whitespace-nowrap">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Sale Price</th>
                
                {/* ✨ NEW: Hoverable Tooltip for Purchase Price ✨ */}
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    Purchase Price
                    <div className="group relative flex items-center">
                      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
                      
                      {/* Tooltip Box */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-slate-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center leading-relaxed font-normal shadow-xl scale-95 group-hover:scale-100 origin-bottom duration-200">
                        Prices shown reflect the <strong className="text-blue-300">weighted average cost</strong> if this item was purchased at multiple different amounts.
                        {/* Tooltip Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    </div>
                  </div>
                </th>
                
                <th className="px-6 py-4">Tax Rate</th>
                <th className="px-6 py-4 w-48">Current Stock</th>
                <th className="px-6 py-4">Opening Stock</th>
                <th className="px-6 py-4 w-20 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  {/* Name, Code, and Type */}
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 text-sm mb-1">{item.item_name}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">{item.item_code || 'No Code'}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.item_type === 'Service' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {item.item_type || 'Product'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Sale Price */}
                  <td className="px-6 py-4 font-bold text-slate-900 text-sm">
                    ₹{item.sale_price?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || '0.00'}
                    {item.item_type === 'Service' && <span className="text-slate-400 font-medium text-xs ml-1">/srv</span>}
                  </td>
                  
                  {/* Purchase Price */}
                  <td className="px-6 py-4 font-bold text-slate-600 text-sm">
                    {item.item_type === 'Service' ? (
                      <span className="text-slate-300 font-medium">--</span>
                    ) : (
                      `₹${item.purchase_price?.toLocaleString('en-IN', {minimumFractionDigits: 2}) || '0.00'}`
                    )}
                  </td>

                  {/* Tax Rate */}
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      {item.tax_rate > 0 ? `GST ${item.tax_rate}%` : 'Exempt'}
                    </span>
                  </td>
                  
                  {/* Current Stock (with Visual Bar) */}
                  <td className="px-6 py-4">
                    {item.item_type === 'Service' ? (
                      <span className="text-slate-300 font-medium">--</span>
                    ) : (
                      <div className="flex flex-col gap-1.5 w-32">
                        <div className="flex justify-between items-center text-sm">
                          <span className={`font-bold ${item.current_stock <= 5 ? 'text-rose-600' : 'text-slate-700'}`}>
                            {item.current_stock} <span className="text-xs font-medium text-slate-400 uppercase">{item.unit?.toLowerCase()}</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${item.current_stock <= 5 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                            style={{ width: `${Math.min((item.current_stock / 50) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Opening Stock */}
                  <td className="px-6 py-4">
                    {item.item_type === 'Service' ? (
                      <span className="text-slate-300 font-medium">--</span>
                    ) : (
                      <span className="font-semibold text-slate-600 text-sm">
                        {item.opening_stock} <span className="text-xs font-medium text-slate-400 uppercase">{item.unit?.toLowerCase()}</span>
                      </span>
                    )}
                  </td>
                  
                  {/* Actions */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteClick(item.id, item.item_name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>

                </tr>
              ))}
              
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                        <Package className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="font-medium text-slate-500">No items found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Dynamic Pagination Footer */}
        <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-between items-center mt-auto">
          <p className="text-sm font-medium text-slate-400">
            {totalItemsCount > 0 
              ? `Showing ${startEntry} to ${endEntry} of ${totalItemsCount} entries` 
              : 'No entries to show'}
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                currentPage === 1 
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? 'border-slate-100 text-slate-300 cursor-not-allowed bg-slate-50/50' 
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col animate-scale-in border border-slate-100 overflow-hidden">
            
            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">{formData.id ? 'Edit Item' : 'Add New Item'}</h3>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6">
              
              {/* Product vs Service Toggle */}
              <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setFormData({...formData, itemType: 'Product'})}
                  className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all ${formData.itemType === 'Product' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Package className="w-4 h-4 mr-2" /> Product
                </button>
                <button 
                  onClick={() => setFormData({...formData, itemType: 'Service', unit: 'SERVICE'})}
                  className={`flex-1 flex items-center justify-center py-2.5 text-sm font-bold rounded-lg transition-all ${formData.itemType === 'Service' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  <Briefcase className="w-4 h-4 mr-2" /> Service
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{formData.itemType} Name <span className="text-red-500">*</span></label>
                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.itemName} onChange={e => setFormData({...formData, itemName: e.target.value})} placeholder={formData.itemType === 'Product' ? "e.g. Wireless Mouse" : "e.g. Delivery Charge"} />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Code / SKU</label>
                  <input type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.itemCode} onChange={e => setFormData({...formData, itemCode: e.target.value})} placeholder="e.g. MS-01" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sale Price (₹)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} placeholder="0" />
                </div>
                {formData.itemType === 'Product' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Purchase Price (₹)</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} placeholder="0" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tax Rate (%)</label>
                  <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: e.target.value})}>
                    <option value="0">Exempted</option><option value="5">GST 5%</option><option value="12">GST 12%</option><option value="18">GST 18%</option><option value="28">GST 28%</option>
                  </select>
                </div>
                
                {formData.itemType === 'Product' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Opening Stock</label>
                    <input type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-900" value={formData.openingStock} onChange={e => setFormData({...formData, openingStock: e.target.value})} placeholder="0" />
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50 flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-sm">Cancel</button>
              <button onClick={handleSaveItem} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all">
                {formData.id ? 'Update' : 'Save'} {formData.itemType}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}