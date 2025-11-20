'use client';

import { useState, useEffect } from 'react';
import { getApiEndpoint } from '@/lib/api-url';

interface Advertisement {
  id: string;
  code: string;
  nameKz: string;
  nameRu: string;
  type: 'CUSTOM' | 'YANDEX_DIRECT' | 'GOOGLE_ADSENSE';
  position: string;
  size: string;
  isActive: boolean;
  customHtml?: string;
  imageUrl?: string;
  clickUrl?: string;
  yandexBlockId?: string;
  googleAdSlot?: string;
  googleAdClient?: string;
}

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [nameKz, setNameKz] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [type, setType] = useState<'CUSTOM' | 'YANDEX_DIRECT' | 'GOOGLE_ADSENSE'>('CUSTOM');
  const [position, setPosition] = useState('HOME_TOP');
  const [size, setSize] = useState('BANNER_728x90');
  const [customHtml, setCustomHtml] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [clickUrl, setClickUrl] = useState('');
  const [yandexBlockId, setYandexBlockId] = useState('');
  const [googleAdSlot, setGoogleAdSlot] = useState('');
  const [googleAdClient, setGoogleAdClient] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const response = await fetch(getApiEndpoint('/advertisements'));
      const data = await response.json();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const payload: any = {
      code,
      nameKz,
      nameRu,
      type,
      position,
      size,
      isActive,
    };

    if (type === 'CUSTOM') {
      if (customHtml) payload.customHtml = customHtml;
      if (imageUrl) payload.imageUrl = imageUrl;
      if (clickUrl) payload.clickUrl = clickUrl;
    } else if (type === 'YANDEX_DIRECT') {
      payload.yandexBlockId = yandexBlockId;
    } else if (type === 'GOOGLE_ADSENSE') {
      payload.googleAdSlot = googleAdSlot;
      payload.googleAdClient = googleAdClient;
    }

    try {
      const response = await fetch(getApiEndpoint('/advertisements'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Реклама создана успешно');
        setShowForm(false);
        resetForm();
        fetchAds();
      } else {
        alert('Ошибка при создании рекламы');
      }
    } catch (error) {
      console.error('Error creating ad:', error);
      alert('Ошибка при создании рекламы');
    }
  };

  const resetForm = () => {
    setCode('');
    setNameKz('');
    setNameRu('');
    setType('CUSTOM');
    setPosition('HOME_TOP');
    setSize('BANNER_728x90');
    setCustomHtml('');
    setImageUrl('');
    setClickUrl('');
    setYandexBlockId('');
    setGoogleAdSlot('');
    setGoogleAdClient('');
    setIsActive(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту рекламу?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiEndpoint(`/advertisements/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Реклама удалена');
        fetchAds();
      } else {
        alert('Ошибка при удалении рекламы');
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Ошибка при удалении рекламы');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(getApiEndpoint(`/advertisements/${id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchAds();
      }
    } catch (error) {
      console.error('Error toggling ad:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-12"><p className="text-center">Загрузка...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Управление рекламой</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {showForm ? 'Отмена' : 'Добавить рекламу'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Новая реклама</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Код *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Тип *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="CUSTOM">Собственная реклама</option>
                  <option value="YANDEX_DIRECT">Яндекс.Директ</option>
                  <option value="GOOGLE_ADSENSE">Google AdSense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название (KZ) *</label>
                <input
                  type="text"
                  value={nameKz}
                  onChange={(e) => setNameKz(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Название (RU) *</label>
                <input
                  type="text"
                  value={nameRu}
                  onChange={(e) => setNameRu(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Позиция *</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="HOME_TOP">Верх главной страницы</option>
                  <option value="HOME_SIDEBAR">Боковая панель главной</option>
                  <option value="ARTICLE_TOP">Верх страницы статьи</option>
                  <option value="ARTICLE_SIDEBAR">Боковая панель статьи</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Размер *</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="BANNER_728x90">728x90</option>
                  <option value="LARGE_BANNER_970x90">970x90</option>
                  <option value="RECTANGLE_300x250">300x250</option>
                  <option value="HALF_PAGE_300x600">300x600</option>
                  <option value="MOBILE_BANNER_320x50">320x50</option>
                </select>
              </div>
            </div>

            {type === 'CUSTOM' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">HTML код</label>
                  <textarea
                    value={customHtml}
                    onChange={(e) => setCustomHtml(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={4}
                    placeholder="<div>...</div>"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL изображения</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">URL ссылки</label>
                  <input
                    type="text"
                    value={clickUrl}
                    onChange={(e) => setClickUrl(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </>
            )}

            {type === 'YANDEX_DIRECT' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yandex Block ID *</label>
                <input
                  type="text"
                  value={yandexBlockId}
                  onChange={(e) => setYandexBlockId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            )}

            {type === 'GOOGLE_ADSENSE' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Ad Client *</label>
                  <input
                    type="text"
                    value={googleAdClient}
                    onChange={(e) => setGoogleAdClient(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Google Ad Slot *</label>
                  <input
                    type="text"
                    value={googleAdSlot}
                    onChange={(e) => setGoogleAdSlot(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="XXXXXXXXXX"
                    required
                  />
                </div>
              </>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Активна</label>
            </div>

            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Создать
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white shadow-md rounded-lg p-6 border">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{ad.nameKz} / {ad.nameRu}</h3>
                <p className="text-sm text-gray-500">Код: {ad.code}</p>
                <p className="text-sm text-gray-500">Тип: {ad.type}</p>
                <p className="text-sm text-gray-500">Позиция: {ad.position}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(ad.id, ad.isActive)}
                  className={`px-3 py-1 rounded text-sm ${
                    ad.isActive
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {ad.isActive ? 'Активна' : 'Неактивна'}
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
