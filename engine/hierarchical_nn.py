# ==============================================================================
# PRAMANA — Indian Supreme Court Verdict Prediction Research
# Script: engine/hierarchical_nn.py
# Objective: Neural Core for Hierarchical Chunk-Based Document Modeling
# Inspired by: ILDC for CJPE (ACL 2021)
# ==============================================================================

import os
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

class AttentionLayer(nn.Module):
    """
    Additive Attention Mechanism (Bahdanau-style) for pooling sequential chunk representations.
    Computes a learned attention weight alpha_i for each chunk in the legal narrative.
    """
    def __init__(self, hidden_dim):
        super(AttentionLayer, self).__init__()
        self.projection = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.Tanh(),
            nn.Linear(hidden_dim // 2, 1, bias=False)
        )
        
    def forward(self, rnn_outputs, mask=None):
        # rnn_outputs: (batch_size, num_chunks, hidden_dim)
        scores = self.projection(rnn_outputs) # (batch_size, num_chunks, 1)
        
        if mask is not None:
            # Mask out padding chunks with large negative value
            scores = scores.masked_fill(~mask.unsqueeze(-1), -1e9)
            
        weights = torch.softmax(scores, dim=1) # (batch_size, num_chunks, 1)
        context = torch.sum(weights * rnn_outputs, dim=1) # (batch_size, hidden_dim)
        return context, weights.squeeze(-1)


class HierarchicalBiGRUWithAttention(nn.Module):
    """
    Hierarchical Document Processing Architecture:
    Chunks -> Dense Projection -> Bidirectional GRU -> Additive Attention -> Calibrated Verdict Head.
    """
    def __init__(self, chunk_input_dim=256, chunk_emb_dim=128, rnn_hidden_dim=64, dropout_p=0.3):
        super(HierarchicalBiGRUWithAttention, self).__init__()
        
        # 1. Chunk Dense Encoder
        self.chunk_encoder = nn.Sequential(
            nn.Linear(chunk_input_dim, chunk_emb_dim),
            nn.LayerNorm(chunk_emb_dim),
            nn.ReLU(),
            nn.Dropout(dropout_p)
        )
        
        # 2. Sequential Document Narrative Modeler (BiGRU)
        self.bigru = nn.GRU(
            input_size=chunk_emb_dim,
            hidden_size=rnn_hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True
        )
        
        # 3. Additive Attention Pooling
        self.attention = AttentionLayer(hidden_dim=rnn_hidden_dim * 2)
        
        # 4. Classification Head
        self.classifier = nn.Sequential(
            nn.Dropout(dropout_p),
            nn.Linear(rnn_hidden_dim * 2, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )
        
    def forward(self, chunks, mask=None):
        # chunks: (batch_size, num_chunks, chunk_input_dim)
        encoded_chunks = self.chunk_encoder(chunks) # (B, M, emb_dim)
        rnn_out, _ = self.bigru(encoded_chunks)      # (B, M, 2*rnn_hidden)
        doc_vector, attn_weights = self.attention(rnn_out, mask=mask) # (B, 2*rnn_hidden), (B, M)
        logits = self.classifier(doc_vector).squeeze(-1) # (B,)
        probs = torch.sigmoid(logits)
        return logits, probs, attn_weights


def create_hierarchical_model(chunk_input_dim=256, chunk_emb_dim=128, rnn_hidden_dim=64, dropout_p=0.3):
    """Factory function for initializing the model."""
    model = HierarchicalBiGRUWithAttention(
        chunk_input_dim=chunk_input_dim,
        chunk_emb_dim=chunk_emb_dim,
        rnn_hidden_dim=rnn_hidden_dim,
        dropout_p=dropout_p
    )
    return model


def train_epoch(model, optimizer, criterion, chunk_batches, label_batches, max_grad_norm=1.0):
    """Executes one training epoch over document chunk sequences."""
    model.train()
    total_loss = 0.0
    num_samples = 0
    
    for chunks_np, labels_np in zip(chunk_batches, label_batches):
        chunks = torch.tensor(chunks_np, dtype=torch.float32)
        labels = torch.tensor(labels_np, dtype=torch.float32)
        
        optimizer.zero_grad()
        logits, _, _ = model(chunks)
        loss = criterion(logits, labels)
        loss.backward()
        
        if max_grad_norm > 0:
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_grad_norm)
            
        optimizer.step()
        
        total_loss += loss.item() * len(labels)
        num_samples += len(labels)
        
    return total_loss / max(1, num_samples)


def evaluate_model(model, chunk_batches, label_batches):
    """Evaluates the hierarchical model on validation or test document chunks."""
    model.eval()
    all_preds = []
    all_probs = []
    all_targets = []
    total_loss = 0.0
    criterion = nn.BCEWithLogitsLoss()
    num_samples = 0
    
    with torch.no_grad():
        for chunks_np, labels_np in zip(chunk_batches, label_batches):
            chunks = torch.tensor(chunks_np, dtype=torch.float32)
            labels = torch.tensor(labels_np, dtype=torch.float32)
            
            logits, probs, _ = model(chunks)
            loss = criterion(logits, labels)
            
            total_loss += loss.item() * len(labels)
            num_samples += len(labels)
            
            preds = (probs >= 0.5).long().cpu().numpy()
            all_preds.extend(preds)
            all_probs.extend(probs.cpu().numpy())
            all_targets.extend(labels_np)
            
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    all_targets = np.array(all_targets)
    
    acc = np.mean(all_preds == all_targets) if len(all_targets) > 0 else 0.0
    
    # Calculate precision, recall, F1
    tp = np.sum((all_preds == 1) & (all_targets == 1))
    fp = np.sum((all_preds == 1) & (all_targets == 0))
    fn = np.sum((all_preds == 0) & (all_targets == 1))
    tn = np.sum((all_preds == 0) & (all_targets == 0))
    
    precision = tp / max(1, (tp + fp))
    recall = tp / max(1, (tp + fn))
    f1 = 2 * precision * recall / max(1e-8, (precision + recall))
    balanced_acc = 0.5 * (tp / max(1, (tp + fn)) + tn / max(1, (tn + fp)))
    
    return {
        "loss": float(total_loss / max(1, num_samples)),
        "accuracy": float(acc),
        "balanced_accuracy": float(balanced_acc),
        "precision": float(precision),
        "recall": float(recall),
        "f1": float(f1),
        "tp": int(tp), "fp": int(fp), "fn": int(fn), "tn": int(tn),
        "predictions": all_preds.tolist(),
        "probabilities": all_probs.tolist()
    }


def predict_document(model, chunk_matrix_np):
    """
    Generates prediction, calibrated probability, and chunk attention weights for a single case.
    chunk_matrix_np: (num_chunks, chunk_input_dim)
    """
    model.eval()
    with torch.no_grad():
        chunks = torch.tensor(chunk_matrix_np, dtype=torch.float32).unsqueeze(0) # (1, M, D)
        logits, probs, attn = model(chunks)
        prob_allowed = float(probs[0].item())
        pred_label = "ALLOWED" if prob_allowed >= 0.5 else "DISMISSED"
        attn_scores = attn[0].cpu().numpy().tolist()
        
    return {
        "predicted_label": pred_label,
        "prob_allowed": prob_allowed,
        "prob_dismissed": 1.0 - prob_allowed,
        "attention_weights": attn_scores
    }


def explain_document_loco(model, chunk_matrix_np):
    """
    Executes Leave-One-Chunk-Out (LOCO) occlusion explainability.
    Directly computes causal delta probability when each chunk is removed from the narrative.
    """
    model.eval()
    num_chunks = len(chunk_matrix_np)
    
    # 1. Base prediction
    base_pred = predict_document(model, chunk_matrix_np)
    base_prob = base_pred["prob_allowed"]
    target_class = base_pred["predicted_label"]
    base_target_prob = base_prob if target_class == "ALLOWED" else (1.0 - base_prob)
    
    loco_results = []
    
    if num_chunks <= 1:
        return [{
            "chunk_index": 0,
            "delta_probability": 0.0,
            "importance_score": 0.0,
            "direction": "NEUTRAL"
        }]
        
    with torch.no_grad():
        for i in range(num_chunks):
            # Mask chunk i by removing it from the sequence
            ablated_chunks = np.delete(chunk_matrix_np, i, axis=0)
            chunks_t = torch.tensor(ablated_chunks, dtype=torch.float32).unsqueeze(0)
            _, probs, _ = model(chunks_t)
            new_prob = float(probs[0].item())
            new_target_prob = new_prob if target_class == "ALLOWED" else (1.0 - new_prob)
            
            # Delta = Base Prob - Perturbed Prob
            # Positive delta means the chunk pushed TOWARD the predicted class (it was influential)
            delta = base_target_prob - new_target_prob
            
            direction = "SUPPORTING" if delta > 0.005 else ("OPPOSING" if delta < -0.005 else "NEUTRAL")
            
            loco_results.append({
                "chunk_index": i,
                "base_prob": round(base_target_prob, 4),
                "ablated_prob": round(new_target_prob, 4),
                "delta_probability": round(delta, 5),
                "importance_score": round(abs(delta), 5),
                "direction": direction
            })
            
    # Sort by importance descending
    loco_results.sort(key=lambda x: abs(x["delta_probability"]), reverse=True)
    return loco_results


def save_model(model, filepath):
    """Saves PyTorch model state dictionary."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    torch.save(model.state_dict(), filepath)
    

def load_model(model, filepath):
    """Loads PyTorch model state dictionary."""
    model.load_state_dict(torch.load(filepath, map_location=torch.device('cpu')))
    model.eval()
    return model
