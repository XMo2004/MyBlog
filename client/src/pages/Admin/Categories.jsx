import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Search, X, FolderTree, Layers, ChevronRight } from 'lucide-react';
import Select from '../../components/Select';
import { categoriesApi } from '../../lib/api';
import Toast from '../../components/Toast';
import Loading from '../../components/Loading';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: undefined,
    name: '',
    description: '',
    parentId: ''
  });

  useEffect(() => {
    fetchCategories();
  }, [searchTerm]);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await categoriesApi.getAll({ search: searchTerm });
      setCategories(res.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      setMessage({ type: 'error', text: '获取分类失败' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除该分类吗？其下文章不会删除，但关联会清空。')) return;
    setMessage({ type: '', text: '' });
    try {
      await categoriesApi.delete(id);
      setCategories(categories.filter(c => c.id !== id));
      setMessage({ type: 'success', text: '分类已删除' });
    } catch (error) {
      console.error('Failed to delete category', error);
      const msg = error.response?.data?.message || '删除失败';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleEdit = (category) => {
    setFormData({
      id: category.id,
      name: category.name || '',
      description: category.description || '',
      parentId: category.parentId || ''
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ id: undefined, name: '', description: '', parentId: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const dataToSubmit = {
      name: formData.name.trim(),
      description: formData.description || '',
      parentId: formData.parentId ? parseInt(formData.parentId) : null
    };
    try {
      if (!dataToSubmit.name) {
        setMessage({ type: 'error', text: '分类名称不能为空' });
        return;
      }
      if (formData.id) {
        const res = await categoriesApi.update(formData.id, dataToSubmit);
        setCategories(categories.map(c => (c.id === formData.id ? res.data : c)));
        setMessage({ type: 'success', text: '分类已更新' });
      } else {
        const res = await categoriesApi.create(dataToSubmit);
        setCategories([...categories, res.data]);
        setMessage({ type: 'success', text: '分类已创建' });
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save category', error);
      const msg = error.response?.data?.message || '保存失败';
      setMessage({ type: 'error', text: msg });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (id, checked) => {
    setSelectedIds(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确定要批量删除 ${selectedIds.length} 个分类吗？`)) return;
    setMessage({ type: '', text: '' });
    try {
      await categoriesApi.bulkDelete(selectedIds);
      setCategories(categories.filter(c => !selectedIds.includes(c.id)));
      setSelectedIds([]);
      setMessage({ type: 'success', text: '批量删除成功' });
    } catch (error) {
      console.error('Failed to bulk delete categories', error);
      const msg = error.response?.data?.message || '批量删除失败';
      setMessage({ type: 'error', text: msg });
    }
  };

  const parentOptions = [
    { value: '', label: '无（顶级分类）' },
    ...categories.map(c => ({ value: String(c.id), label: `${c.name}（Lv${c.level}）` }))
  ];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <Toast message={message.text} type={message.type} onClose={() => setMessage({ type: '', text: '' })} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FolderTree className="text-primary" /> 分类管理
        </h1>

        {!isEditing && (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input
                type="text"
                placeholder="搜索分类..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-colors"
              >
                删除 ({selectedIds.length})
              </button>
            )}
            <button
              onClick={() => { handleCancel(); setIsEditing(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              <Plus size={16} /> 新建
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card p-4 md:p-6 rounded-lg border border-border"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">{formData.id ? '编辑分类' : '新建分类'}</h2>
              <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">分类名称</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="输入分类名称"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">父级分类</label>
                    <Select
                      value={formData.parentId?.toString() || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, parentId: val }))}
                      options={parentOptions}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">支持最多三级分类。选择父级时将自动计算层级。</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">描述</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={6}
                      placeholder="分类描述（可选）"
                      className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
                  保存
                </button>
                <button type="button" onClick={handleCancel} className="px-4 py-2 bg-muted/50 text-muted-foreground rounded-md text-sm font-medium hover:bg-muted/70">
                  取消
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-card p-4 md:p-6 rounded-lg border border-border"
          >
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left text-muted-foreground font-medium">
                    <th className="p-3 w-10"></th>
                    <th className="p-3">名称</th>
                    <th className="p-3">描述</th>
                    <th className="p-3 w-28">层级</th>
                    <th className="p-3 w-32">父级</th>
                    <th className="p-3 w-24">文章数</th>
                    <th className="p-3 w-28">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categories.map(c => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(c.id)}
                          onChange={(e) => handleSelect(c.id, e.target.checked)}
                        />
                      </td>
                      <td className="p-3 font-medium flex items-center gap-2">
                        <Layers size={14} className="text-muted-foreground" />
                        {c.name}
                      </td>
                      <td className="p-3 text-muted-foreground truncate max-w-[260px]" title={c.description || ''}>{c.description || '-'}</td>
                      <td className="p-3">Lv{c.level || 1}</td>
                      <td className="p-3">{c.parentId ? categories.find(x => x.id === c.parentId)?.name || c.parentId : '-'}</td>
                      <td className="p-3">{c._count?.posts ?? '-'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="px-2 py-1 bg-secondary/50 text-muted-foreground rounded-md hover:bg-secondary"
                            title="编辑"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="px-2 py-1 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-muted-foreground">暂无分类</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">已选择 {selectedIds.length} 项</span>
                <button onClick={handleBulkDelete} className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20">
                  批量删除
                </button>
                <button onClick={() => setSelectedIds([])} className="text-sm text-muted-foreground hover:text-foreground">
                  取消选择
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCategories;
